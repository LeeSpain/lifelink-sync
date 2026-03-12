import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

const IDLE_TIMEOUT = 5 * 60_000; // 5 minutes before entering idle mode

interface TabletPhotoFrameProps {
  /** Number of unread alerts — if > 0, idle mode won't activate */
  alertCount: number;
}

export function TabletPhotoFrame({ alertCount }: TabletPhotoFrameProps) {
  const { t } = useTranslation();
  const [idle, setIdle] = useState(false);
  const [now, setNow] = useState(new Date());

  // Reset idle on any interaction
  const resetIdle = useCallback(() => {
    setIdle(false);
  }, []);

  useEffect(() => {
    if (alertCount > 0) {
      setIdle(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const scheduleIdle = () => {
      timer = setTimeout(() => setIdle(true), IDLE_TIMEOUT);
    };

    const handleActivity = () => {
      setIdle(false);
      clearTimeout(timer);
      scheduleIdle();
    };

    scheduleIdle();
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [alertCount]);

  // Keep clock ticking in idle mode
  useEffect(() => {
    if (!idle) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [idle]);

  if (!idle) return null;

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div
      className="fixed inset-0 z-[90] bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-1000"
      onClick={resetIdle}
      onTouchStart={resetIdle}
    >
      {/* CLARA ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="w-96 h-96 rounded-full bg-primary blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 opacity-15">
        <img
          src="/lovable-uploads/lifelink-sync-icon-512.png"
          alt="LifeLink Sync"
          className="w-16 h-16 mx-auto"
        />
      </div>

      {/* Clock */}
      <div className="relative z-10 text-center">
        <p className="text-7xl md:text-8xl font-extralight text-white tracking-tight">
          {timeStr}
        </p>
        <p className="text-xl md:text-2xl text-slate-400 mt-2 font-light">
          {dateStr}
        </p>
      </div>

      {/* Status */}
      <div className="relative z-10 flex items-center gap-2 mt-10 text-emerald-400">
        <ShieldCheck className="h-5 w-5" />
        <span className="text-sm font-medium">
          {t('tablet.ambient.allClear', { defaultValue: 'All Clear' })}
        </span>
      </div>

      {/* Tap to dismiss hint */}
      <p className="relative z-10 text-xs text-slate-600 mt-8">
        {t('tablet.ambient.tapToWake', { defaultValue: 'Tap anywhere to return' })}
      </p>
    </div>
  );
}
