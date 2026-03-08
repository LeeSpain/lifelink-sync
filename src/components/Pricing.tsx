import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Check, Shield, Users, Heart, Pill, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
  <div className="rounded-xl p-6 border border-[#E5E7EB] bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-primary">{icon}</div>
      <h4 className="text-lg font-bold font-poppins text-[hsl(215,25%,27%)]">{name}</h4>
      {badge && (
        <Badge className="bg-green-100 text-green-800 text-xs">{badge}</Badge>
      )}
    </div>
    <div className="flex items-baseline gap-1 mb-3">
      <span className="text-2xl font-bold font-poppins text-primary">{price}</span>
      <span className="text-sm text-gray-500">{t('pricing.perMonth')}</span>
    </div>
    <p className="text-sm text-gray-500 mb-4">{description}</p>
    <div className="space-y-2">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-wellness" />
          <span className="text-xs text-gray-600">{feature}</span>
        </div>
      ))}
    </div>
  </div>
  );
};

const Pricing: React.FC = () => {
  const { t } = useTranslation();

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
      price: t('pricing.addOns.price', '€2.99'),
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
      price: t('pricing.addOns.price', '€2.99'),
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
      price: t('pricing.addOns.price', '€2.99'),
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
            {t('pricing.heroTitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            {t('pricing.heroSubtitle')}
          </p>
        </div>

        {/* Base Plan */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="rounded-2xl p-5 sm:p-8 bg-[hsl(215,28%,17%)] text-white border-primary shadow-xl">
            <Badge className="bg-primary text-white text-xs font-medium mb-4">
              {t('pricing.basePlan.badge')}
            </Badge>
            <h3 className="text-2xl font-bold font-poppins mb-2 text-white">{t('pricing.basePlan.name')}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold font-poppins text-primary">{t('pricing.basePlan.price')}</span>
              <span className="text-sm text-gray-400">{t('pricing.perMonth')}</span>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              {t('pricing.basePlan.description')}
            </p>
            <div className="space-y-3 mb-8">
              {basePlanFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="text-sm text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
            <Button asChild className="w-full font-semibold py-6 bg-primary text-white hover:bg-primary/90">
              <Link to="/trial-signup">
                <Shield className="h-4 w-4 mr-2" />
                {t('pricing.startTrial')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-2xl font-bold font-poppins text-center mb-2 text-[hsl(215,25%,27%)]">
            {t('pricing.addOnsTitle')}
          </h3>
          <p className="text-center text-gray-500 mb-8">
            {t('pricing.addOnsSubtitle')}
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {addOns.map((addon, i) => (
              <AddOnCard key={i} {...addon} />
            ))}
          </div>

          {/* CLARA Complete Banner */}
          <div className="rounded-xl p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-bold font-poppins text-purple-900">CLARA Complete</h4>
              <Badge className="bg-green-100 text-green-800">{t('pricing.claraComplete.badge')}</Badge>
            </div>
            <p className="text-sm text-purple-700 max-w-lg mx-auto">
              {t('pricing.claraComplete.description')}
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          {t('pricing.callCentreNote')}
        </p>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {t('pricing.pendantNote')}{' '}
            <Link to="/devices/lifelink-sync-pendant" className="text-primary underline hover:text-primary/80 font-medium">
              {t('pricing.pendantLink')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
