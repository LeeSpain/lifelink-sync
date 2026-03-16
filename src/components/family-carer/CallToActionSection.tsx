import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Shield, Clock, CheckCircle, ArrowRight, Phone, Heart, Star } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const CallToActionSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-32 bg-gradient-hero relative overflow-hidden">

      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-wellness/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emergency/20 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">

          {/* Main CTA */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              {t('familyCarer.cta.titleLine1')}
              <br />
              <span className="bg-gradient-to-r from-wellness via-white to-emergency-glow bg-clip-text text-transparent">
                {t('familyCarer.cta.titleLine2')}
              </span>
            </h2>
            <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('familyCarer.cta.subtitle')}
            </p>

            <div className="flex flex-col lg:flex-row gap-6 justify-center items-center mb-16">
              <Button
                asChild
                size="xl"
                className="bg-wellness text-black hover:bg-wellness/90 shadow-glow font-bold text-2xl px-16 py-8 rounded-2xl hover-scale"
              >
                <Link to="/onboarding">
                  <UserPlus className="mr-4 h-8 w-8" />
                  {t('familyCarer.cta.startProtecting')}
                  <ArrowRight className="ml-4 h-8 w-8" />
                </Link>
              </Button>

              <div className="flex items-center space-x-3 text-white/80">
                <div className="w-2 h-2 bg-wellness rounded-full animate-pulse"></div>
                <span className="font-medium">{t('familyCarer.cta.setupNote')}</span>
              </div>
            </div>
          </div>

          {/* Trust Indicators Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">

            {/* Privacy */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 group-hover:scale-110 transition-all duration-300">
                <Shield className="h-10 w-10 text-wellness" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('familyCarer.cta.privacyTitle')}</h3>
              <p className="text-white/80 text-lg">
                {t('familyCarer.cta.privacyDescription')}
              </p>
            </div>

            {/* Speed */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 group-hover:scale-110 transition-all duration-300">
                <Clock className="h-10 w-10 text-emergency-glow" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('familyCarer.cta.speedTitle')}</h3>
              <p className="text-white/80 text-lg">
                {t('familyCarer.cta.speedDescription')}
              </p>
            </div>

            {/* Guarantee */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle className="h-10 w-10 text-wellness" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('familyCarer.cta.guaranteeTitle')}</h3>
              <p className="text-white/80 text-lg">
                {t('familyCarer.cta.guaranteeDescription')}
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center mb-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <div className="flex items-center justify-center space-x-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-wellness fill-current" />
                ))}
                <span className="text-white font-bold text-xl ml-4">4.9/5</span>
              </div>
              <p className="text-xl text-white/90 mb-4">
                {t('familyCarer.cta.testimonialQuote')}
              </p>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-wellness rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">{t('familyCarer.cta.testimonialName')}</div>
                  <div className="text-white/60 text-sm">{t('familyCarer.cta.testimonialRole')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="text-center">
            <p className="text-white/60 text-lg mb-6">
              {t('familyCarer.cta.helpChoosing')}
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-lg px-8 backdrop-blur-sm"
            >
              <Link to="/contact">
                <Phone className="h-5 w-5 mr-2" />
                {t('familyCarer.cta.talkToExpert')}
              </Link>
            </Button>
          </div>

          {/* Final Trust Line */}
          <div className="text-center mt-12">
            <p className="text-white/40 text-sm">
              {t('familyCarer.cta.trustLine')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};