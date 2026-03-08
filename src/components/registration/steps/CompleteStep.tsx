import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Shield, Users, Phone, Bell } from 'lucide-react';

interface CompleteStepProps {
  firstName: string;
  isTrialSelected: boolean;
}

const NEXT_STEP_KEYS = ['testSos', 'checkCircles', 'reviewContacts', 'notifications'] as const;
const NEXT_STEP_ICONS = [Shield, Users, Phone, Bell];

const CompleteStep: React.FC<CompleteStepProps> = ({ firstName, isTrialSelected }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-8 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-wellness/10">
          <CheckCircle className="h-10 w-10 text-wellness" />
        </div>
        <h2 className="text-3xl font-poppins font-bold text-foreground">
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
        <Badge className="bg-wellness/10 text-wellness border-wellness/20 px-3 py-1">
          <Shield className="h-3 w-3 mr-1.5" />
          {t('registration.complete.accountActive')}
        </Badge>
        {isTrialSelected ? (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
            {t('registration.complete.trialStarted')}
          </Badge>
        ) : (
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            {t('registration.complete.paymentConfirmed')}
          </Badge>
        )}
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
          {t('registration.complete.profileComplete')}
        </Badge>
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
        <Link to="/member-dashboard">
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
