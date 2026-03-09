import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, X } from 'lucide-react';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { useTranslation } from 'react-i18next';

const DISMISS_KEY = 'pwa-install-banner-dismissed';

export function PWAInstallBanner() {
  const { t } = useTranslation();
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  );

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card className="bg-primary/5 border-primary/20 mb-4 sm:mb-6">
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t('dashboard.pwaInstall.title')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.pwaInstall.desc')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isInstallable && (
            <Button size="sm" onClick={installApp}>
              {t('dashboard.pwaInstall.installButton')}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/member-dashboard/mobile-app">
              {t('dashboard.pwaInstall.learnMore')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
