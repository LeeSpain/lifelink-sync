import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Heart, MapPin, Users, Phone, Zap } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const FEATURE_ICONS = [Shield, Users, MapPin, Phone, Heart, Zap];
const FEATURE_KEYS = ['sosAlerts', 'familyCircles', 'realTimeLocation', 'emergencyContacts', 'healthWellness', 'claraAI'];

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const { t } = useTranslation();

  const features = FEATURE_KEYS.map((key, i) => ({
    icon: FEATURE_ICONS[i],
    label: t(`registration.welcome.features.${key}.label`),
    desc: t(`registration.welcome.features.${key}.desc`),
  }));

  return (
    <div className="text-center space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-primary">
          <Shield className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-foreground">
          {t('registration.welcome.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          {t('registration.welcome.subtitle')}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
        {features.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="secondary" className="bg-wellness/10 text-wellness border-wellness/20">
          {t('registration.welcome.badge247')}
        </Badge>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          {t('registration.welcome.badgeGdpr')}
        </Badge>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          {t('registration.welcome.badgeEncrypted')}
        </Badge>
      </div>

      {/* CTA */}
      <Button onClick={onNext} size="lg" className="px-10">
        {t('registration.welcome.getStarted')}
      </Button>
    </div>
  );
};

export default WelcomeStep;
