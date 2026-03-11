import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, Tablet, Share, X } from 'lucide-react';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'pwa-install-banner';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
}

export function PWAInstallBanner() {
  const { t } = useTranslation();
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();
  const { breakpoint } = useBreakpoint();

  const [hidden, setHidden] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'installed' || stored === 'dismissed';
  });

  if (isInstalled || hidden) return null;

  const onIOS = isIOS();
  const onSafari = isSafari();

  // Don't show if not installable AND not on iOS Safari
  if (!isInstallable && !(onIOS && onSafari)) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setHidden(true);
  };

  const handleInstall = async () => {
    await installApp();
    localStorage.setItem(STORAGE_KEY, 'installed');
    setHidden(true);
  };

  const deviceIcon = {
    mobile: <Smartphone className="h-5 w-5 text-primary" />,
    tablet: <Tablet className="h-5 w-5 text-primary" />,
    desktop: <Monitor className="h-5 w-5 text-primary" />,
  }[breakpoint];

  const titleKey = `dashboard.pwaInstall.title_${breakpoint}`;
  const descKey = `dashboard.pwaInstall.desc_${breakpoint}`;

  return (
    <Card className="bg-primary/5 border-primary/20 mb-4 sm:mb-6">
      <CardContent className="flex items-start gap-3 p-3 sm:p-4">
        <div className="p-2 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
          {deviceIcon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t(titleKey)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(descKey)}
          </p>

          {/* iOS Safari: show manual instructions */}
          {onIOS && onSafari && !isInstallable && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              <Share className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{t('dashboard.pwaInstall.iosInstructions')}</span>
            </div>
          )}

          {/* Native install button (Chrome/Edge/etc.) */}
          {isInstallable && (
            <Button size="sm" className="mt-2" onClick={handleInstall}>
              {t('dashboard.pwaInstall.installButton')}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
          onClick={handleDismiss}
          aria-label={t('dashboard.pwaInstall.dismiss')}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
