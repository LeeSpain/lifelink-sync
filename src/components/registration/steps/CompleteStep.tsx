import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Shield, Users, Phone, Bell, Smartphone, Download } from 'lucide-react';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';

interface CompleteStepProps {
  firstName: string;
  isTrialSelected: boolean;
}

const NEXT_STEP_KEYS = ['testSos', 'checkCircles', 'reviewContacts', 'notifications'] as const;
const NEXT_STEP_ICONS = [Shield, Users, Phone, Bell];

const CompleteStep: React.FC<CompleteStepProps> = ({ firstName, isTrialSelected }) => {
  const { t } = useTranslation();
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();

  return (
    <div className="text-center space-y-8 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t('registration.complete.title', { name: firstName ? `, ${firstName}` : '' })}
        </h2>
        <p className="text-muted-foreground">
          {isTrialSelected
            ? t('registration.complete.trialMessage')
            : t('registration.complete.paidMessage')
          }
        </p>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
          <Shield className="h-3 w-3 mr-1.5" />
          {t('registration.complete.accountActive')}
        </Badge>
        {isTrialSelected ? (
          <Badge variant="secondary" className="px-3 py-1">
            {t('registration.complete.trialStarted')}
          </Badge>
        ) : (
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            {t('registration.complete.paymentConfirmed')}
          </Badge>
        )}
        <Badge variant="secondary" className="px-3 py-1">
          {t('registration.complete.profileComplete')}
        </Badge>
      </div>

      {/* PWA Install Prompt */}
      <div className="bg-primary/5 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('registration.complete.installApp.title')}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('registration.complete.installApp.desc')}
        </p>
        {isInstalled ? (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            {t('registration.complete.installApp.installed')}
          </Badge>
        ) : isInstallable ? (
          <Button size="sm" onClick={installApp}>
            <Download className="h-4 w-4 mr-2" />
            {t('registration.complete.installApp.button')}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('registration.complete.installApp.manualHint')}
          </p>
        )}
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {NEXT_STEP_KEYS.map((key, i) => {
          const Icon = NEXT_STEP_ICONS[i];
          return (
            <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t(`registration.complete.nextSteps.${key}.title`)}</p>
                <p className="text-xs text-muted-foreground">{t(`registration.complete.nextSteps.${key}.desc`)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Button asChild size="lg" className="px-10">
        <Link to="/dashboard">
          {t('registration.complete.goToDashboard')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>

      {/* Support */}
      <p className="text-xs text-muted-foreground">
        {t('registration.complete.needHelp')}{' '}
        <a href="mailto:support@lifelink-sync.com" className="text-primary hover:underline">
          support@lifelink-sync.com
        </a>
      </p>
    </div>
  );
};

export default CompleteStep;
