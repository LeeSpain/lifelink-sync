import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Lock, Monitor, X, CheckCircle, Settings } from 'lucide-react';

/**
 * One-time setup guide shown after PWA install to help users enable
 * Android Screen Pinning (kiosk mode) for truly permanent always-on.
 */
export const KioskSetupGuide = () => {
  const { t } = useTranslation('common');
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('tablet-kiosk-guide-dismissed') === '1'
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem('tablet-kiosk-guide-dismissed', '1');
    setDismissed(true);
  };

  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5 max-w-lg w-full shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-400" />
            <h3 className="font-semibold text-white">{t('tablet.kiosk.title')}</h3>
          </div>
          <button onClick={dismiss} className="text-slate-400 hover:text-white p-1" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          {t('tablet.kiosk.description')}
        </p>

        {isAndroid ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <div>
                <p className="text-white font-medium">{t('tablet.kiosk.android.step1Title')}</p>
                <p className="text-slate-400">
                  <Settings className="h-3 w-3 inline" /> {t('tablet.kiosk.android.step1Desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <div>
                <p className="text-white font-medium">{t('tablet.kiosk.android.step2Title')}</p>
                <p className="text-slate-400">{t('tablet.kiosk.android.step2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">3</span>
              </div>
              <div>
                <p className="text-white font-medium">{t('tablet.kiosk.android.step3Title')}</p>
                <p className="text-slate-400">{t('tablet.kiosk.android.step3Desc')}</p>
              </div>
            </div>
            <div className="mt-2 p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-xs text-slate-300">
                  <strong>Tip:</strong> {t('tablet.kiosk.android.tip')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('tablet.kiosk.ipad.title')}</p>
                <p className="text-slate-400">{t('tablet.kiosk.ipad.desc')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300"
            onClick={dismiss}
          >
            {t('tablet.kiosk.laterButton')}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => {
              dismiss();
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {t('tablet.kiosk.doneButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};
