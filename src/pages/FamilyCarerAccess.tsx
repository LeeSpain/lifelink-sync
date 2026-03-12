import React from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from '@/components/SEO';
import { Button } from "@/components/ui/button";
import { Users, Shield, Heart, Clock, Phone, CheckCircle, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";
import { getImageSizes, generateBlurPlaceholder } from "@/utils/imageOptimization";
import { FamilyCircleSection } from "@/components/family-carer/FamilyCircleSection";

const FamilyCarerAccessPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">
      <SEO
        title={t('family.carerSeoTitle')}
        description={t('family.carerSeoDescription')}
        keywords={["family emergency coordination", "emergency alerts", "family safety", "SOS system", "emergency response"]}
      />
      <Navigation />
      
      <main>
        {/* Hero Section - matching homepage layout */}
        <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-hero shadow-2xl">
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="text-center lg:text-left text-white">
                <div className="inline-flex items-center space-x-2 bg-emergency/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg border border-emergency/30">
                  <Users className="h-4 w-4 text-emergency-glow" />
                  <span className="text-sm font-medium text-white">{t('family.familyEmergencyNetwork')}</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
                  {t('family.heroTitle')}
                  <span className="text-wellness drop-shadow-md">{t('family.heroTitleHighlight')}</span>
                </h1>

                <p className="text-xl md:text-2xl mb-8 text-white leading-relaxed font-medium drop-shadow-sm">
                  {t('family.heroDescription')}
                </p>
                

                <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                  {/* Primary CTA */}
                  <Button 
                    asChild
                    size="xl" 
                    className="bg-wellness text-black hover:bg-wellness/90 shadow-glow hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-wellness/20"
                  >
                    <Link to="/register">
                      <Shield className="h-5 w-5 mr-2" />
                      {t('family.joinNow')}
                    </Link>
                  </Button>

                  {/* Watch Video Button */}
                  <Button
                    size="xl"
                    className="bg-wellness text-black hover:bg-wellness/90 shadow-glow hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-wellness/20"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    {t('family.watchVideo')}
                  </Button>
                </div>
              </div>
              
              {/* Hero Image - matching homepage layout */}
              <div className="relative">
                <div className="relative z-10">
                  <OptimizedImage 
                    src="/lovable-uploads/7b271d34-59d8-4874-9441-77c857b01fac.png" 
                    alt="Family carer emergency coordination - woman and elderly man using emergency alert system with family access dashboard"
                    className="w-full h-full object-cover rounded-3xl shadow-2xl"
                    priority={true}
                    sizes={getImageSizes('hero')}
                    blurDataURL={generateBlurPlaceholder(400, 600)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Family Circle Section */}
        <FamilyCircleSection />

        {/* Pricing Section */}
      </main>
      
      <Footer />
    </div>
  );
};

export default FamilyCarerAccessPage;