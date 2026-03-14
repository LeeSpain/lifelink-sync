import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, Heart, Pill, Users, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePricing } from '@/hooks/usePricing';
import { cn } from '@/lib/utils';

interface PlanStepProps {
  data: {
    selectedPlanId: string;
    isTrialSelected: boolean;
    billingInterval?: 'month' | 'year';
  };
  onChange: (field: string, value: any) => void;
}

const PlanStep: React.FC<PlanStepProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const { prices, formatPrice } = usePricing();

  const isTrial = data.isTrialSelected === true;

  const handleSelectTrial = () => {
    onChange('selectedPlanId', 'individual-plan');
    onChange('isTrialSelected', true);
  };

  const handleSelectPaid = () => {
    onChange('selectedPlanId', 'individual-plan');
    onChange('isTrialSelected', false);
    if (!data.billingInterval) onChange('billingInterval', 'month');
  };

  // Default to trial on mount
  React.useEffect(() => {
    if (!data.selectedPlanId) {
      handleSelectTrial();
    }
  }, []);

  const mainFeatures = [
    t('pricingWizard.features.claraAi', 'CLARA AI — 24/7 AI safety assistant'),
    t('pricingWizard.features.appSos', 'App SOS button (one tap)'),
    t('pricingWizard.features.voice', 'Voice activation ("CLARA, help me")'),
    t('pricingWizard.features.pendant', 'Bluetooth pendant support'),
    t('pricingWizard.features.gps', 'Live GPS location sharing'),
    t('pricingWizard.features.family', 'Family circle notifications'),
    t('pricingWizard.features.medical', 'Medical profile for first responders'),
    t('pricingWizard.features.bridge', 'Conference bridge'),
    t('pricingWizard.features.callback', 'Instant callback'),
    t('pricingWizard.features.freeLink', '1 Family Link included FREE'),
  ];

  const addons = [
    {
      icon: Heart,
      title: t('pricingWizard.wellbeingTitle', 'Daily Wellbeing'),
      price: formatPrice(prices.addon_daily_wellbeing),
      desc: t('pricingWizard.wellbeingDesc', 'CLARA daily check-in, mood tracking and family digest'),
      features: [
        t('pricingWizard.wellbeingF1', 'Daily CLARA check-in call'),
        t('pricingWizard.wellbeingF2', 'Mood, sleep and pain tracking'),
        t('pricingWizard.wellbeingF3', 'Family wellbeing digest'),
        t('pricingWizard.wellbeingF4', 'Safety check-in included'),
      ],
    },
    {
      icon: Pill,
      title: t('pricingWizard.medicationTitle', 'Medication Reminder'),
      price: formatPrice(prices.addon_medication_reminder),
      desc: t('pricingWizard.medicationDesc', 'AI reminders, dose logging and family notification if missed'),
      features: [
        t('pricingWizard.medicationF1', 'Daily medication reminders'),
        t('pricingWizard.medicationF2', 'Dose confirmation logging'),
        t('pricingWizard.medicationF3', 'Family notified if missed'),
        t('pricingWizard.medicationF4', 'Medication schedule management'),
      ],
    },
    {
      icon: Users,
      title: t('pricingWizard.familyLinkTitle', 'Extra Family Link'),
      price: formatPrice(prices.family_link_monthly),
      desc: t('pricingWizard.familyLinkDesc', 'Add more family members to your protection circle'),
      perUnit: true,
      features: [
        t('pricingWizard.familyF1', 'Full circle access'),
        t('pricingWizard.familyF2', 'Real-time emergency alerts'),
        t('pricingWizard.familyF3', 'Live GPS updates'),
        t('pricingWizard.familyF4', 'No cap on links'),
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t('pricingWizard.title', 'Choose Your Plan')}</h2>
        <p className="text-sm text-muted-foreground">{t('pricingWizard.subtitle', 'Start protecting yourself and your family today')}</p>
      </div>

      {/* Option Toggle */}
      <div className="grid grid-cols-2 gap-3">
        {/* Free Trial Option */}
        <button
          onClick={handleSelectTrial}
          className={cn(
            'rounded-xl border-2 p-4 text-left transition-all',
            isTrial
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border bg-background hover:border-primary/40'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">{t('pricingWizard.badgeRecommended', 'RECOMMENDED')}</Badge>
            {isTrial && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>}
          </div>
          <p className="font-bold text-foreground text-sm">{t('pricingWizard.trialTitle', '7-Day Free Trial')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('pricingWizard.trialSubtitle', 'No card required · Try everything free')}</p>
          <p className="text-xs font-medium text-primary mt-2">
            {t('pricingWizard.thenPrice', { price: formatPrice(prices.individual_monthly), defaultValue: `Then ${formatPrice(prices.individual_monthly)}/month` })}
          </p>
        </button>

        {/* Join Now Option */}
        <button
          onClick={handleSelectPaid}
          className={cn(
            'rounded-xl border-2 p-4 text-left transition-all',
            !isTrial
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border bg-background hover:border-primary/40'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              <Zap className="h-2.5 w-2.5 mr-1 inline" />{t('pricingWizard.badgeFullAccess', 'FULL ACCESS')}
            </Badge>
            {!isTrial && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>}
          </div>
          <p className="font-bold text-foreground text-sm">{t('pricingWizard.joinNowTitle', 'Join Now')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('pricingWizard.joinNowSubtitle', 'Instant full access · All benefits today')}</p>
          <p className="text-xs font-medium text-primary mt-2">
            {formatPrice(prices.individual_monthly)}/{t('pricingWizard.month', 'month')} · {t('pricingWizard.startImmediately', 'Start immediately')}
          </p>
        </button>
      </div>

      {/* Main Plan Card */}
      <Card className="border-2 border-primary shadow-lg">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">{t('pricingWizard.mainPlanName', 'Individual Plan')}</h3>
                <Badge className="bg-primary text-white">{t('pricingWizard.mainPlanBadge', 'START HERE')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('pricingWizard.mainPlanDesc', 'Complete emergency protection with CLARA AI — your 24/7 safety companion')}
              </p>
            </div>
          </div>

          {/* Billing cycle selector — only when paid selected */}
          {!isTrial && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => onChange('billingInterval', 'month')}
                className={cn(
                  'flex-1 rounded-lg border-2 p-3 text-left transition-all',
                  data.billingInterval !== 'year'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <p className="font-bold text-sm">{formatPrice(prices.individual_monthly)}<span className="text-xs font-normal text-muted-foreground">/{t('pricingWizard.month', 'month')}</span></p>
                <p className="text-xs text-muted-foreground">{t('pricingWizard.billedMonthly', 'Billed monthly')}</p>
              </button>
              <button
                onClick={() => onChange('billingInterval', 'year')}
                className={cn(
                  'flex-1 rounded-lg border-2 p-3 text-left transition-all relative',
                  data.billingInterval === 'year'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <Badge className="absolute -top-2 right-2 bg-green-100 text-green-700 text-[10px]">{t('pricing.saveBadge', '2 months free')}</Badge>
                <p className="font-bold text-sm">{formatPrice(prices.individual_annual)}<span className="text-xs font-normal text-muted-foreground">/{t('pricingWizard.year', 'year')}</span></p>
                <p className="text-xs text-muted-foreground">{t('pricingWizard.billedAnnually', 'Billed annually')}</p>
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-foreground">
              {!isTrial && data.billingInterval === 'year'
                ? <>{formatPrice(prices.individual_annual)}<span className="text-sm font-normal text-muted-foreground">/{t('pricingWizard.year', 'year')}</span></>
                : <>{formatPrice(prices.individual_monthly)}<span className="text-sm font-normal text-muted-foreground">/{t('pricingWizard.month', 'month')}</span></>
              }
            </div>
            {isTrial && (
              <span className="text-sm text-green-600 font-medium pb-1">· {t('pricingWizard.trialNote', '7 days free first')}</span>
            )}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mainFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {isTrial ? (
            <>
              <Button
                onClick={handleSelectTrial}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-full text-base py-6"
                size="lg"
              >
                {t('pricingWizard.ctaButton', 'Start Free Trial')}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t('pricingWizard.trialCtaNote', { price: `${formatPrice(prices.individual_monthly)}`, defaultValue: `No card required · Then ${formatPrice(prices.individual_monthly)}/month · Cancel anytime` })}
              </p>
            </>
          ) : (
            <>
              <Button
                onClick={handleSelectPaid}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-full text-base py-6"
                size="lg"
              >
                {t('pricingWizard.joinNowButton', 'Join Now — Get Full Access Today')}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t('pricingWizard.paidCtaNote', { price: `${formatPrice(prices.individual_monthly)}`, defaultValue: `${formatPrice(prices.individual_monthly)}/month · Full access from day 1 · Cancel anytime` })}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add-Ons Section */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground">{t('pricingWizard.addonsTitle', 'Enhance Your Protection')}</h3>
          <p className="text-sm text-muted-foreground">{t('pricingWizard.addonsSubtitle', 'Add these after you start your trial')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {addons.map((addon) => (
            <Card key={addon.title} className="border border-border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <addon.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm font-bold text-primary">
                    +{addon.price}/{addon.perUnit ? t('pricingWizard.each', 'each') : t('pricingWizard.month', 'month')}
                  </div>
                </div>
                <h4 className="font-semibold text-foreground text-sm">{addon.title}</h4>
                <p className="text-xs text-muted-foreground">{addon.desc}</p>
                <ul className="space-y-1">
                  {addon.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CLARA Complete Banner */}
      <div className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-foreground text-sm">{t('pricingWizard.claraCompleteTitle', 'CLARA Complete')}</h4>
            <Badge className="bg-primary text-white text-[10px]">{t('pricingWizard.claraCompleteBadge', 'BEST VALUE')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('pricingWizard.claraCompleteText', 'Activate both Wellbeing and Medication add-ons and CLARA Complete unlocks FREE — weekly AI reports and enhanced monitoring included automatically.')}
          </p>
        </div>
      </div>

      {/* Bottom Note */}
      <p className="text-xs text-muted-foreground text-center">
        {t('pricingWizard.bottomNote', 'All prices in EUR · Cancel anytime · No contracts · GDPR compliant')}
      </p>
    </div>
  );
};

export default PlanStep;
