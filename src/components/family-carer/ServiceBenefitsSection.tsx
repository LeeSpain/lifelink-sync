import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, MapPin, Users, Shield, MessageSquare, Timer, Phone, Eye, Zap, ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useTranslation } from 'react-i18next';

export const ServiceBenefitsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-32 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-emergency/10 rounded-full blur-xl animate-[pulse_3s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-wellness/10 rounded-full blur-xl animate-[pulse_4s_ease-in-out_infinite]"></div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t('familyCarer.benefits.titlePrefix')}
            <span className="bg-gradient-to-r from-emergency via-primary to-wellness bg-clip-text text-transparent"> {t('familyCarer.benefits.titleHighlight')}</span>
          </h2>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {t('familyCarer.benefits.subtitle')}
          </p>
        </div>

        {/* Interactive Emergency Simulation */}
        <div className="max-w-7xl mx-auto mb-32">
          <div className="relative bg-gradient-to-br from-guardian/10 via-primary/5 to-emergency/10 rounded-4xl p-12 border border-primary/20 backdrop-blur-sm">

            {/* Timeline Header */}
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground mb-4">{t('familyCarer.benefits.timelineTitle')}</h3>
              <p className="text-xl text-muted-foreground">{t('familyCarer.benefits.timelineSubtitle')}</p>
            </div>

            {/* Timeline Flow */}
            <div className="grid lg:grid-cols-4 gap-8 relative">

              {/* Connection Lines */}
              <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-emergency via-primary to-wellness rounded-full hidden lg:block"></div>

              {/* Emergency Trigger */}
              <div className="relative">
                <div className="w-16 h-16 bg-emergency rounded-2xl flex items-center justify-center mx-auto mb-6 emergency-pulse shadow-emergency">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">{t('familyCarer.benefits.sosTriggered')}</h4>
                <div className="bg-emergency/10 rounded-xl p-4 border border-emergency/20">
                  <p className="text-sm text-foreground font-medium mb-2">{t('familyCarer.benefits.sosTime')}</p>
                  <p className="text-xs text-muted-foreground">{t('familyCarer.benefits.sosLocation')}</p>
                </div>
              </div>

              {/* Family Alerts */}
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">{t('familyCarer.benefits.familyAlerted')}</h4>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-sm text-foreground font-medium mb-2">{t('familyCarer.benefits.alertTime')}</p>
                  <p className="text-xs text-muted-foreground">{t('familyCarer.benefits.alertRecipients')}</p>
                </div>
              </div>

              {/* Response */}
              <div className="relative">
                <div className="w-16 h-16 bg-wellness rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">{t('familyCarer.benefits.response')}</h4>
                <div className="bg-wellness/10 rounded-xl p-4 border border-wellness/20">
                  <p className="text-sm text-foreground font-medium mb-2">{t('familyCarer.benefits.responseTime')}</p>
                  <p className="text-xs text-muted-foreground">{t('familyCarer.benefits.responseMessage')}</p>
                </div>
              </div>

              {/* Coordination */}
              <div className="relative">
                <div className="w-16 h-16 bg-guardian rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">{t('familyCarer.benefits.resolved')}</h4>
                <div className="bg-guardian/10 rounded-xl p-4 border border-guardian/20">
                  <p className="text-sm text-foreground font-medium mb-2">{t('familyCarer.benefits.resolvedTime')}</p>
                  <p className="text-xs text-muted-foreground">{t('familyCarer.benefits.resolvedMessage')}</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <div className="inline-flex items-center bg-wellness/20 rounded-full px-6 py-3 border border-wellness/30">
                <Zap className="h-5 w-5 text-wellness mr-2" />
                <span className="text-wellness font-bold">{t('familyCarer.benefits.totalTime')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('familyCarer.benefits.whyChooseTitle')}
            </h3>
            <p className="text-xl text-muted-foreground">{t('familyCarer.benefits.whyChooseSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Privacy First */}
            <div className="group relative bg-gradient-to-br from-guardian/10 to-guardian/5 rounded-3xl p-8 border border-guardian/20 hover:border-guardian/40 transition-all duration-500 hover-scale">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-guardian rounded-2xl flex items-center justify-center mr-4">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-foreground">{t('familyCarer.benefits.privacyTitle')}</h4>
              </div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('familyCarer.benefits.privacyDescription')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-guardian rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.privacyFeature1')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-guardian rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.privacyFeature2')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-guardian rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.privacyFeature3')}</span>
                </div>
              </div>
            </div>

            {/* Instant Response */}
            <div className="group relative bg-gradient-to-br from-emergency/10 to-emergency/5 rounded-3xl p-8 border border-emergency/20 hover:border-emergency/40 transition-all duration-500 hover-scale">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-emergency rounded-2xl flex items-center justify-center mr-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-foreground">{t('familyCarer.benefits.lightningTitle')}</h4>
              </div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('familyCarer.benefits.lightningDescription')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-emergency rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.lightningFeature1')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-emergency rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.lightningFeature2')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-emergency rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.lightningFeature3')}</span>
                </div>
              </div>
            </div>

            {/* Coordinated Response */}
            <div className="group relative bg-gradient-to-br from-wellness/10 to-wellness/5 rounded-3xl p-8 border border-wellness/20 hover:border-wellness/40 transition-all duration-500 hover-scale">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-wellness rounded-2xl flex items-center justify-center mr-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-foreground">{t('familyCarer.benefits.coordinationTitle')}</h4>
              </div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('familyCarer.benefits.coordinationDescription')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-wellness rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.coordinationFeature1')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-wellness rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.coordinationFeature2')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-wellness rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.coordinationFeature3')}</span>
                </div>
              </div>
            </div>

            {/* Professional Support */}
            <div className="group relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover-scale">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-foreground">{t('familyCarer.benefits.professionalTitle')}</h4>
              </div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('familyCarer.benefits.professionalDescription')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.professionalFeature1')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.professionalFeature2')}</span>
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>{t('familyCarer.benefits.professionalFeature3')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};