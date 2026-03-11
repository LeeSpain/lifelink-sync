import { AlertTriangle, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TabletAlert } from '@/hooks/useTabletAlerts';

interface TabletAlertSystemProps {
  activeAlert: TabletAlert | null;
  onAcknowledge: (alertId: string) => void;
  onRemindLater?: (alertId: string) => void;
}

export function TabletAlertSystem({
  activeAlert,
  onAcknowledge,
  onRemindLater,
}: TabletAlertSystemProps) {
  if (!activeAlert || activeAlert.acknowledged) return null;

  // CRITICAL — full screen red flash overlay
  if (activeAlert.level === 'critical') {
    return (
      <>
        {/* Pulsing red background overlay */}
        <div className="fixed inset-0 z-[60] pointer-events-none animate-[criticalFlash_0.5s_ease-in-out_infinite]" />

        {/* Alert card — centered */}
        <div className="fixed inset-0 z-[61] flex items-center justify-center p-6">
          <div className="bg-red-950 border-2 border-red-500 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-red-500/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center animate-pulse flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-200">EMERGENCY ALERT</h2>
                <p className="text-red-300 text-sm mt-1">{activeAlert.title}</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {activeAlert.who && (
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-sm font-semibold w-16">WHO</span>
                  <span className="text-white text-lg">{activeAlert.who}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-sm font-semibold w-16 pt-0.5">WHAT</span>
                <span className="text-white text-lg">{activeAlert.message}</span>
              </div>
              {activeAlert.location && (
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-sm font-semibold w-16">WHERE</span>
                  <span className="text-white text-lg">{activeAlert.location}</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={() => onAcknowledge(activeAlert.id)}
              className="w-full min-h-[64px] text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-2xl"
            >
              I'VE SEEN THIS
            </Button>
          </div>
        </div>

        <style>{`
          @keyframes criticalFlash {
            0%, 100% { background-color: rgba(220, 38, 38, 0.25); }
            50% { background-color: transparent; }
          }
        `}</style>
      </>
    );
  }

  // WARNING — amber pulsing border + slide-in banner
  if (activeAlert.level === 'warning') {
    return (
      <>
        {/* Amber border glow overlay */}
        <div className="fixed inset-0 z-[55] pointer-events-none animate-[warningPulse_1s_ease-in-out_infinite]"
          style={{
            boxShadow: 'inset 0 0 60px rgba(245, 158, 11, 0.15)',
            border: '3px solid rgba(245, 158, 11, 0.3)',
          }}
        />

        {/* Slide-in banner from top */}
        <div className="fixed top-0 left-0 right-0 z-[56] p-4 animate-[slideDown_0.3s_ease-out]">
          <div className="bg-amber-950/95 backdrop-blur border border-amber-500/40 rounded-2xl p-5 max-w-2xl mx-auto shadow-lg shadow-amber-500/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-amber-200">{activeAlert.title}</h3>
                <p className="text-amber-100 mt-1">{activeAlert.message}</p>
                {activeAlert.who && (
                  <p className="text-amber-300/70 text-sm mt-1">{activeAlert.who}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {onRemindLater && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemindLater(activeAlert.id)}
                    className="text-amber-300 border-amber-500/30 hover:bg-amber-500/10 text-xs"
                  >
                    Remind in 15 min
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAcknowledge(activeAlert.id)}
                  className="text-amber-400 hover:bg-amber-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes warningPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </>
    );
  }

  // INFO — no overlay, handled via toast in the dashboard
  return null;
}
