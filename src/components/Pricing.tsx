import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Check, Shield, Users, Heart, Pill, Sparkles, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { usePricing } from "@/hooks/usePricing";

interface AddOnProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  badge?: string;
}

const AddOnCard: React.FC<AddOnProps> = ({ name, price, description, features, icon, badge }) => {
  const { t } = useTranslation();
  return (
  <div className="rounded-xl p-6 border border-border bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-primary">{icon}</div>
      <h4 className="text-lg font-bold text-foreground">{name}</h4>
      {badge && (
        <Badge className="bg-primary/10 text-primary text-xs">{badge}</Badge>
      )}
    </div>
    <div className="flex items-baseline gap-1 mb-3">
      <span className="text-2xl font-bold text-primary">{price}</span>
      <span className="text-sm text-muted-foreground">{t('pricing.perMonth')}</span>
    </div>
    <p className="text-sm text-muted-foreground mb-4">{description}</p>
    <div className="space-y-2">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
          <span className="text-xs text-muted-foreground">{feature}</span>
        </div>
      ))}
    </div>
    <Badge variant="secondary" className="mt-3 text-xs">{t('pricing.availableAfterJoining')}</Badge>
  </div>
  );
};

const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const { prices, formatPrice } = usePricing();
  const [isAnnual, setIsAnnual] = useState(false);

  const basePlanFeatures = [
    t('pricing.basePlan.feature1'),
    t('pricing.basePlan.feature2'),
    t('pricing.basePlan.feature3'),
    t('pricing.basePlan.feature4'),
    t('pricing.basePlan.feature5'),
    t('pricing.basePlan.feature6'),
  ];

  const addOns: AddOnProps[] = [
    {
      name: t('pricing.addOns.familyLink.name'),
      price: formatPrice(prices.family_link_monthly),
      description: t('pricing.addOns.familyLink.description'),
      features: [
        t('pricing.addOns.familyLink.feature1'),
        t('pricing.addOns.familyLink.feature2'),
        t('pricing.addOns.familyLink.feature3'),
      ],
      icon: <Users className="h-5 w-5" />,
      badge: t('pricing.addOns.familyLink.badge'),
    },
    {
      name: t('pricing.addOns.dailyWellbeing.name'),
      price: formatPrice(prices.addon_daily_wellbeing),
      description: t('pricing.addOns.dailyWellbeing.description'),
      features: [
        t('pricing.addOns.dailyWellbeing.feature1'),
        t('pricing.addOns.dailyWellbeing.feature2'),
        t('pricing.addOns.dailyWellbeing.feature3'),
      ],
      icon: <Heart className="h-5 w-5" />,
    },
    {
      name: t('pricing.addOns.medicationReminder.name'),
      price: formatPrice(prices.addon_medication_reminder),
      description: t('pricing.addOns.medicationReminder.description'),
      features: [
        t('pricing.addOns.medicationReminder.feature1'),
        t('pricing.addOns.medicationReminder.feature2'),
        t('pricing.addOns.medicationReminder.feature3'),
      ],
      icon: <Pill className="h-5 w-5" />,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            {t('pricing.heroTitle')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
            {t('pricing.heroSubtitle')}
          </p>
          <Button asChild size="lg" className="font-semibold py-6 px-10 bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg">
            <Link to="/trial-signup">
              <Shield className="h-5 w-5 mr-2" />
              {t('pricing.startTrial')}
            </Link>
          </Button>

          {/* Monthly / Annual Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('pricing.monthly', { defaultValue: 'Monthly' })}
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-muted'}`}
              aria-label="Toggle annual pricing"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('pricing.annual', { defaultValue: 'Annual' })}
            </span>
            {isAnnual && (
              <Badge className="bg-green-100 text-green-700 text-xs font-medium">
                {t('pricing.saveBadge', { defaultValue: '2 months free' })}
              </Badge>
            )}
          </div>
        </div>

        {/* Base Plan */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="rounded-2xl p-5 sm:p-8 bg-foreground text-background border-primary shadow-xl">
            <Badge className="bg-primary text-white text-xs font-medium mb-4">
              {t('pricing.basePlan.badge')}
            </Badge>
            <h3 className="text-2xl font-bold mb-2 text-white">{t('pricing.basePlan.name')}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              {isAnnual ? (
                <>
                  <span className="text-2xl font-bold text-primary">{formatPrice(prices.individual_annual)}</span>
                  <span className="text-sm text-white/60">{t('pricing.perYear', { defaultValue: '/year' })}</span>
                  <span className="text-xs text-white/40 line-through ml-2">{formatPrice(prices.individual_monthly * 12)}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-primary">{formatPrice(prices.individual_monthly)}</span>
                  <span className="text-sm text-white/60">{t('pricing.perMonth')}</span>
                </>
              )}
            </div>
            {isAnnual && (
              <p className="text-xs text-green-400 mb-2">
                {t('pricing.annualSavings', { defaultValue: 'Save €19.98 — 2 months free' })}
              </p>
            )}
            <p className="text-sm text-white/70 mb-6">
              {t('pricing.basePlan.description')}
            </p>
            <div className="space-y-3">
              {basePlanFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="text-sm text-white/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-2xl font-bold text-center mb-2 text-foreground">
            {t('pricing.addOnsTitle')}
          </h3>
          <p className="text-center text-muted-foreground mb-8">
            {t('pricing.addOnsSubtitle')}
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {addOns.map((addon, i) => (
              <AddOnCard key={i} {...addon} />
            ))}
          </div>

          {/* CLARA Complete Banner */}
          <div className="rounded-xl p-6 bg-primary/5 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-bold text-foreground">CLARA Complete</h4>
              <Badge className="bg-primary/10 text-primary">{t('pricing.claraComplete.badge')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {t('pricing.claraComplete.description')}
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          {t('pricing.callCentreNote')}
        </p>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('pricing.pendantNote')}{' '}
            <span className="text-muted-foreground/70">
              Bluetooth Pendant — Coming Soon
            </span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/gift" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium hover:underline">
            <Gift className="h-4 w-4" />
            {t('pricing.giftLifeLink', { defaultValue: 'Gift LifeLink Sync to someone you love' })}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
