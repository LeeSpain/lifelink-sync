// Tablet Alert Sound Effects — Web Audio API
// Sounds only play after first user interaction (browser autoplay policy)

let audioContext: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];

function getContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Critical alert: repeating urgent beep pattern
 * 880Hz → 1320Hz, 0.3s on 0.1s off, repeats until stopped
 */
export function playCriticalAlert(): void {
  stopAllSounds();
  const ctx = getContext();

  const playBeep = () => {
    if (!audioContext || audioContext.state === 'closed') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    activeOscillators.push(osc);
    osc.onended = () => {
      activeOscillators = activeOscillators.filter((o) => o !== osc);
    };
  };

  // Repeat every 400ms (300ms on + 100ms gap)
  playBeep();
  const interval = setInterval(() => {
    if (!audioContext || audioContext.state === 'closed') {
      clearInterval(interval);
      return;
    }
    playBeep();
  }, 400);

  // Store interval ID on context for cleanup
  (audioContext as any).__criticalInterval = interval;
}

/**
 * Warning chime: single descending tone
 * 660Hz → 440Hz, 0.5s smooth
 */
export function playWarningChime(): void {
  stopAllSounds();
  const ctx = getContext();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.5);

  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);

  activeOscillators.push(osc);
  osc.onended = () => {
    activeOscillators = activeOscillators.filter((o) => o !== osc);
  };
}

/**
 * Info ping: single soft tone
 * 880Hz, 0.1s, low gain
 */
export function playInfoPing(): void {
  const ctx = getContext();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Stop all active sounds and clear repeating patterns
 */
export function stopAllSounds(): void {
  // Clear critical alert interval
  if (audioContext && (audioContext as any).__criticalInterval) {
    clearInterval((audioContext as any).__criticalInterval);
    (audioContext as any).__criticalInterval = null;
  }

  // Stop all active oscillators
  for (const osc of activeOscillators) {
    try {
      osc.stop();
    } catch {
      // Already stopped
    }
  }
  activeOscillators = [];
}

/**
 * Ensure AudioContext is ready (call on first user interaction)
 */
export function initAudio(): void {
  getContext();
}
