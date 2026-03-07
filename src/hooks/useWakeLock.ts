import { useEffect, useRef, useState, useCallback } from 'react';

export function useWakeLock(autoRequest = true) {
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<any>(null);

  const request = useCallback(async () => {
    try {
      const nav: any = navigator as any;
      if (!nav?.wakeLock?.request) {
        console.warn('Wake Lock API not supported in this environment');
        return false;
      }
      const sentinel = await nav.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);

      // Handle release events
      if (typeof sentinel.addEventListener === 'function') {
        const onRelease = () => setIsActive(false);
        sentinel.addEventListener('release', onRelease);
      } else if ('onrelease' in sentinel) {
        sentinel.onrelease = () => setIsActive(false);
      }

      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      setIsActive(false);
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    try {
      if (sentinelRef.current && typeof sentinelRef.current.release === 'function') {
        await sentinelRef.current.release();
        sentinelRef.current = null;
      }
      setIsActive(false);
      return true;
    } catch (err) {
      console.warn('Wake Lock release failed:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!autoRequest) return;

    let mounted = true;
    request();

    const onVisibility = () => {
      if (mounted && document.visibilityState === 'visible' && !isActive) {
        request();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [autoRequest, isActive, release, request]);

  return { isActive, request, release };
}
