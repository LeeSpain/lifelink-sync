import React from 'react';
import { Button } from "@/components/ui/button";
import { Shield, Heart, MapPin, Users, Clock, CheckCircle, Play, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { IntroVideoModal } from "@/components/IntroVideoModal";
import { useTranslation } from 'react-i18next';

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-section bg-gradient-hero shadow-2xl">
      <div className="container mx-auto px-4">
        {/* Header - matching other sections */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black bg-white p-4 rounded-lg shadow-sm mb-4 inline-block">
            {t('familyCarer.hero.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('familyCarer.hero.subtitle')}
          </p>
        </div>

        {/* Main Content - matching Features section layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Right Side - Benefits */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  {t('familyCarer.hero.protectTitle')}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {t('familyCarer.hero.protectDescription')}
                </p>
              </div>

              <div className="grid gap-6 mb-8">
                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-emergency/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-emergency" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('familyCarer.hero.instantSosTitle')}</h4>
                    <p className="text-muted-foreground">{t('familyCarer.hero.instantSosDescription')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-wellness/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-wellness" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('familyCarer.hero.familyNetworkTitle')}</h4>
                    <p className="text-muted-foreground">{t('familyCarer.hero.familyNetworkDescription')}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-wellness hover:bg-wellness/90 text-black font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link to="/onboarding">
                      <Shield className="h-5 w-5 mr-2" />
                      {t('familyCarer.hero.startProtecting')}
                    </Link>
                  </Button>
                  <IntroVideoModal
                    defaultVideoId="family-coordination"
                    trigger={
                      <Button
                        size="lg"
                        className="bg-wellness text-black hover:bg-wellness/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 py-4"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        {t('familyCarer.hero.watchDemo')}
                      </Button>
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('familyCarer.hero.freeTrialNote')}
                </p>
              </div>
            </div>

            {/* Left Side - Demo Preview */}
            <div className="relative order-2 lg:order-1">
              {/* Phone Mockup with emergency coordination flow */}
              <div className="relative mx-auto w-80 h-[600px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-gray-50 to-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 bg-primary text-white text-sm font-medium">
                    <span>{t('familyCarer.hero.emergencyCoordination')}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                      <span className="ml-2 text-xs">100%</span>
                    </div>
                  </div>

                  {/* Emergency Alert Interface */}
                  <div className="p-4 h-full flex flex-col">
                    <div className="bg-emergency/10 border border-emergency/20 p-4 rounded-xl mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-emergency rounded-full animate-pulse"></div>
                        <span className="font-semibold text-emergency">{t('familyCarer.hero.sosAlertActive')}</span>
                      </div>
                      <p className="text-sm text-gray-700">{t('familyCarer.hero.sarahNeedsHelp')}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          M
                        </div>
                        <div>
                          <p className="font-medium text-green-800 text-sm">{t('familyCarer.hero.momResponding')}</p>
                          <p className="text-xs text-green-600">{t('familyCarer.hero.twoMinAway')}</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          D
                        </div>
                        <div>
                          <p className="font-medium text-blue-800 text-sm">{t('familyCarer.hero.dadEnRoute')}</p>
                          <p className="text-xs text-blue-600">{t('familyCarer.hero.fiveMinAway')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary text-white rounded-xl p-4 mt-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{t('familyCarer.hero.emergencyServices')}</p>
                          <p className="text-xs opacity-90">{t('familyCarer.hero.professionalMonitoring')}</p>
                        </div>
                        <Phone className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Feature Highlights - matching Features section */}
              <div className="absolute -left-8 top-20 bg-white rounded-xl p-3 shadow-xl border border-wellness/20 max-w-44">
                <div className="flex items-center mb-1">
                  <Shield className="h-4 w-4 text-wellness mr-2" />
                  <span className="font-semibold text-xs">{t('familyCarer.hero.privacyProtected')}</span>
                </div>
                <p className="text-xs text-gray-600">{t('familyCarer.hero.locationEmergencyOnly')}</p>
              </div>

              <div className="absolute -right-8 bottom-32 bg-white rounded-xl p-3 shadow-xl border border-primary/20 max-w-44">
                <div className="flex items-center mb-1">
                  <Clock className="h-4 w-4 text-primary mr-2" />
                  <span className="font-semibold text-xs">{t('familyCarer.hero.instantResponse')}</span>
                </div>
                <p className="text-xs text-gray-600">{t('familyCarer.hero.familyAlerted30s')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};