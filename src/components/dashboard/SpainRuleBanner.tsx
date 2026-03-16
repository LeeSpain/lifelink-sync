import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SpainRuleBannerProps {
  spainRule?: {
    canProceed: boolean;
    activeConnections: number;
    hasRegional: boolean;
    isSpain: boolean;
  } | null;
}

export const SpainRuleBanner: React.FC<SpainRuleBannerProps> = ({ spainRule }) => {
  // REMOVED - Regional Services not yet active
  return null;
  const { t } = useTranslation();
  if (!spainRule || !spainRule.isSpain || spainRule.canProceed) {
    return null;
  }

  const handleSubscribeRegional = () => {
    // TODO: Implement regional subscription flow
    console.log('Subscribe to regional support');
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold mb-1">{t('spainRule.complianceTitle')}</p>
            <p className="text-sm">
              {t('spainRule.complianceDescription', { count: spainRule.activeConnections })}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSubscribeRegional}
            className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            {t('spainRule.subscribeRegional')}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};