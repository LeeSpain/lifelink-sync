import { Mic, Bell, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initAudio } from '@/utils/tabletSounds';

interface TabletPermissionsOverlayProps {
  onComplete: (mic: 'granted' | 'skipped', notifications: 'granted' | 'skipped') => void;
}

export function TabletPermissionsOverlay({ onComplete }: TabletPermissionsOverlayProps) {
  const handleAllowAll = async () => {
    // Initialize audio context on user interaction
    initAudio();

    let micResult: 'granted' | 'skipped' = 'skipped';
    let notifResult: 'granted' | 'skipped' = 'skipped';

    // Request microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately — we just needed permission
      stream.getTracks().forEach((t) => t.stop());
      micResult = 'granted';
    } catch {
      micResult = 'skipped';
    }

    // Request notifications
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        notifResult = result === 'granted' ? 'granted' : 'skipped';
      } catch {
        notifResult = 'skipped';
      }
    }

    onComplete(micResult, notifResult);
  };

  const handleSkip = () => {
    // Still initialize audio context on user tap (needed for sounds later)
    initAudio();
    onComplete('skipped', 'skipped');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-8">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-10 w-10 text-emerald-400" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-3">
          Enable Full Protection
        </h2>
        <p className="text-slate-400 mb-8 text-base leading-relaxed">
          LifeLink needs access to your microphone and notifications for the best tablet experience.
        </p>

        {/* Permission items */}
        <div className="space-y-4 mb-8 text-left">
          <div className="flex items-start gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Mic className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Microphone Access</p>
              <p className="text-slate-400 text-sm mt-0.5">
                For CLARA voice — say "Hey Clara" to get help hands-free
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-medium">Notification Permission</p>
              <p className="text-slate-400 text-sm mt-0.5">
                For emergency alerts — critical SOS and safety notifications
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleAllowAll}
            className="w-full min-h-[56px] text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
          >
            Allow All
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={handleSkip}
            className="w-full min-h-[48px] text-sm text-slate-500 hover:text-slate-300"
          >
            Skip (limited features)
          </Button>
        </div>
      </div>
    </div>
  );
}
