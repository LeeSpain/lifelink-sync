import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, Droplets, Battery, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";

const PendantPromo: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    { icon: <Bluetooth className="h-5 w-5" />, text: t('pendantPromo.feature1') },
    { icon: <Droplets className="h-5 w-5" />, text: t('pendantPromo.feature2') },
    { icon: <Battery className="h-5 w-5" />, text: t('pendantPromo.feature3') },
  ];

  return (
    <section id="pendant-promo" className="py-20 bg-[hsl(215,28%,17%)]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              <OptimizedImage
                src="/lovable-uploads/acfcc77a-7e34-44f5-8487-4069c2acb56b.png"
                alt={t('pendantPromo.title')}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Content */}
          <div className="text-center lg:text-left">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
              {t('pendantPromo.badge')}
            </Badge>

            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4 text-white">
              {t('pendantPromo.title')}
            </h2>

            <p className="text-gray-300 font-inter mb-8 max-w-md mx-auto lg:mx-0">
              {t('pendantPromo.subtitle')}
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-200">
                  <div className="text-primary">{feature.icon}</div>
                  <span className="text-sm font-inter">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                <span className="text-4xl font-bold font-poppins text-primary">{t('pendantPromo.price')}</span>
                <span className="text-sm text-gray-400">{t('pendantPromo.shipping')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('pendantPromo.oneTime')}</p>
            </div>

            {/* CTA — Coming Soon */}
            <Badge className="px-6 py-3 text-base font-semibold bg-white/10 text-white border border-white/20">
              Coming Soon
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PendantPromo;
