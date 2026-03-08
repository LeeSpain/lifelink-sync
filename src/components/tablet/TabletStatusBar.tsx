import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Shield } from 'lucide-react';
import { ClaraPresenceIndicator } from '@/components/tablet/ClaraPresenceIndicator';

interface ClaraState {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  hasPermission: boolean | null;
  transcript: string;
  onToggleMute: () => void;
  onToggleListening: () => void;
}

interface TabletStatusBarProps {
  wakeLockActive: boolean;
  claraState?: ClaraState;
}

export const TabletStatusBar = ({ wakeLockActive, claraState }: TabletStatusBarProps) => {
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-red-400" />
        <span className="font-semibold text-sm tracking-wide">LifeLink Sync</span>
      </div>

      <div className="text-center">
        <span className="text-lg font-light">{dateStr}</span>
      </div>

      <div className="flex items-center gap-4">
        {claraState && <ClaraPresenceIndicator {...claraState} />}
        <span className="text-2xl font-semibold tabular-nums">{timeStr}</span>
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          {wakeLockActive && (
            <span className="text-[10px] text-green-400 uppercase tracking-wider">Always On</span>
          )}
        </div>
      </div>
    </div>
  );
};
