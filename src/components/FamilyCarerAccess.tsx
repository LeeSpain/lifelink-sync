import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Heart, Shield, Clock, UserCheck, CheckCircle2, Play } from 'lucide-react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { IntroVideoModal } from '@/components/IntroVideoModal';
import { usePreferences } from '@/contexts/PreferencesContext';
import { convertCurrency, formatDisplayCurrency, languageToLocale } from '@/utils/currency';
import familyCarerImage from '@/assets/family-carer-support.jpg';

const FamilyCarerAccess = () => {
  const { t } = useTranslation();
  const { currency, language } = usePreferences();
  
  // Family pricing from subscription plans
  const basePriceEUR = 2.99;
  const convertedPrice = convertCurrency(basePriceEUR, 'EUR', currency);
  const formattedPrice = formatDisplayCurrency(convertedPrice, currency, languageToLocale(language));
  const billingInterval = t('common.perMonth');

  const features = [
    'Trusted family contacts & emergency coordination',
    'Professional care coordination with medical teams',
    'Privacy controls for family access levels',
    'Real-time updates during emergency situations',
    'Multi-generational family support plans',
    'Secure family communication channels'
  ];

  return (
    <section className="py-14">
      <div className="container mx-auto px-4">
        {/* Emergency Protection Plan Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-warning/10 via-warning/5 to-warning/10 rounded-3xl p-8 border border-warning/20 shadow-xl relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5"></div>
            
            {/* Core Plan Badge */}
            <div className="absolute top-6 right-6 z-10">
              <Badge className="bg-warning text-white text-sm px-4 py-2 shadow-lg border-0">
                <Users className="h-3 w-3 mr-1" />
                {t('familyCarerAccess.sectionBadge')}
              </Badge>
            </div>

            <div className="relative z-10">
              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-5 gap-8 items-center">
                {/* Left Column - Plan Details (3/5 width) */}
                <div className="lg:col-span-3">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-warning to-warning/80 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {t('familyCarerAccess.cardTitle')}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-warning">{formattedPrice}</span>
                        <span className="text-muted-foreground">/{billingInterval}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {t('familyCarerAccess.cardDescription')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Button 
                      size="lg"
                      className="bg-warning hover:bg-warning/90 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <Link to="/family-carer-access">{t('familyCarerAccess.learnMore')}</Link>
                    </Button>
                    
                    <IntroVideoModal 
                      defaultVideoId="family"
                      trigger={
                        <Button 
                          size="lg"
                          variant="outline"
                          className="border-warning text-warning hover:bg-warning hover:text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {t('familyCarerAccess.watchVideo')}
                        </Button>
                      }
                    />
                  </div>

                  {/* Compact Features Grid */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {features.slice(0, 6).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-2.5 w-2.5 text-warning" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right Column - Plan Image (2/5 width) */}
                <div className="lg:col-span-2 relative">
                  {/* Floating accents - smaller and more subtle */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-warning/15 rounded-full flex items-center justify-center">
                    <Heart className="h-3 w-3 text-warning" />
                  </div>
                  <div className="absolute top-1/3 -left-3 w-5 h-5 bg-warning/15 rounded-full flex items-center justify-center">
                    <Users className="h-2.5 w-2.5 text-warning" />
                  </div>
                  <div className="absolute bottom-4 right-4 w-5 h-5 bg-warning/15 rounded-full flex items-center justify-center">
                    <Shield className="h-2.5 w-2.5 text-warning" />
                  </div>
                  
                  <div className="bg-white/90 rounded-2xl p-4 shadow-lg border border-white/50 backdrop-blur-sm">
                    <img
                      src={familyCarerImage}
                      alt="Professional family care support - Multi-generational family representing comprehensive family protection services"
                      className="w-full h-auto rounded-xl shadow-md object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FamilyCarerAccess;