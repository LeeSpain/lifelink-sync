import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Three-layer keep-awake strategy:
 *
 * Layer 1 — W3C Screen Wake Lock API (standard, works in Chrome/Edge)
 * Layer 2 — Capacitor KeepAwake plugin (native Android/iOS builds)
 * Layer 3 — Silent audio loop fallback (prevents Android Chrome from suspending the tab)
 *
 * All three layers are attempted. If one fails, the others compensate.
 */

// --- Layer 2: Capacitor KeepAwake (lazy import, only works in native shell) ---
let capacitorKeepAwake: { keepAwake: () => Promise<void>; allowSleep: () => Promise<void> } | null = null;

async function tryCapacitorKeepAwake() {
  try {
    const mod = await import('@capacitor-community/keep-awake');
    capacitorKeepAwake = mod.KeepAwake;
    await capacitorKeepAwake!.keepAwake();
    console.log('🔋 Capacitor KeepAwake active');
    return true;
  } catch (e) {
    console.debug('Capacitor KeepAwake not available (expected in browser):', e);
    return false;
  }
}

async function releaseCapacitorKeepAwake() {
  try {
    if (capacitorKeepAwake) {
      await capacitorKeepAwake.allowSleep();
    }
  } catch (e) {
    console.debug('Failed to release Capacitor KeepAwake:', e);
  }
}

// --- Layer 3: Silent audio loop (NoSleep pattern) ---
function createSilentAudio(): HTMLAudioElement | null {
  try {
    // Tiny silent WAV (44 bytes of silence, base64-encoded)
    const silentWav =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

    const audio = new Audio(silentWav);
    audio.loop = true;
    audio.volume = 0.001; // Near-silent but nonzero (0 may be optimised away)
    audio.setAttribute('playsinline', '');
    return audio;
  } catch {
    return null;
  }
}

export function useWakeLock(autoRequest = true) {
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);

  // --- Layer 1: Screen Wake Lock API ---
  const requestWakeLock = useCallback(async () => {
    try {
      const nav: any = navigator as any;
      if (!nav?.wakeLock?.request) return false;

      const sentinel = await nav.wakeLock.request('screen');
      sentinelRef.current = sentinel;

      if (typeof sentinel.addEventListener === 'function') {
        sentinel.addEventListener('release', () => {
          if (mountedRef.current) setIsActive(false);
        });
      } else if ('onrelease' in sentinel) {
        sentinel.onrelease = () => {
          if (mountedRef.current) setIsActive(false);
        };
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  // --- Layer 3: Silent audio ---
  const startSilentAudio = useCallback(() => {
    if (audioRef.current) return true;
    const audio = createSilentAudio();
    if (!audio) return false;

    audioRef.current = audio;
    // Must be triggered from a user interaction context on first play;
    // subsequent plays (after visibility change) will work automatically
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked — will retry on next user interaction
        console.log('🔇 Silent audio autoplay blocked, will retry on interaction');
      });
    }
    return true;
  }, []);

  const stopSilentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  // Combined request: all three layers
  const request = useCallback(async () => {
    const results = await Promise.all([
      requestWakeLock(),
      tryCapacitorKeepAwake(),
    ]);
    startSilentAudio();

    const anySuccess = results.some(Boolean);
    if (mountedRef.current) setIsActive(anySuccess || !!audioRef.current);
    return anySuccess;
  }, [requestWakeLock, startSilentAudio]);

  // Combined release
  const release = useCallback(async () => {
    try {
      if (sentinelRef.current?.release) {
        await sentinelRef.current.release();
        sentinelRef.current = null;
      }
    } catch (e) { console.debug('Wake lock release failed:', e); }

    await releaseCapacitorKeepAwake();
    stopSilentAudio();

    if (mountedRef.current) setIsActive(false);
    return true;
  }, [stopSilentAudio]);

  useEffect(() => {
    mountedRef.current = true;
    if (!autoRequest) return;

    request();

    // Re-acquire on visibility change (tab comes back to foreground)
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        request();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Also try to start silent audio on first user interaction (for autoplay policy)
    const onInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      // Also request fullscreen if not already
      if (document.fullscreenElement === null && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    document.addEventListener('click', onInteraction, { once: false });
    document.addEventListener('touchstart', onInteraction, { once: false });

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('touchstart', onInteraction);
      release();
    };
  }, [autoRequest, request, release]);

  return { isActive, request, release };
}
