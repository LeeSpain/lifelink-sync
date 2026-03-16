import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Phone, Bluetooth, Users, Shield, Speaker } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { IntroVideoModal } from "@/components/IntroVideoModal";

const AppPreviewSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-section">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black bg-white p-4 rounded-lg shadow-sm mb-4 inline-block">
            {t('common.voiceActivatedProtection')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('common.responseDescription')}
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left Side - Smart Device Integration */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  {t('common.smartDeviceIntegration')}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {t('common.deviceIntegrationDescription')}
                </p>
              </div>

              <div className="grid gap-6 mb-8">
                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Speaker className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('common.smartSpeaker')}</h4>
                    <p className="text-muted-foreground">{t('common.smartSpeakerDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-emergency/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bluetooth className="h-6 w-6 text-emergency" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('common.bluetoothPendant')}</h4>
                    <p className="text-muted-foreground">{t('common.bluetoothPendantDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-wellness/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mic className="h-6 w-6 text-wellness" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('common.voiceRecognition')}</h4>
                    <p className="text-muted-foreground">{t('common.voiceRecognitionDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button
                    disabled
                    size="lg"
                    className="bg-wellness/50 text-black/50 font-semibold px-8 py-4 cursor-not-allowed"
                  >
                    <Bluetooth className="h-5 w-5 mr-2" />
                    Coming Soon
                  </Button>
                  <IntroVideoModal 
                    defaultVideoId="lifelink-sync-pendant"
                    trigger={
                      <Button 
                        size="lg" 
                        className="bg-wellness hover:bg-wellness/90 text-black font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Speaker className="h-5 w-5 mr-2" />
                        {t('common.watchVideo')}
                      </Button>
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('common.compatible')}
                </p>
              </div>
            </div>

            {/* Right Side - Emergency Response Flow */}
            <div className="relative">
              {/* Emergency Response Visualization */}
              <div className="bg-gradient-to-br from-emergency/5 to-primary/5 rounded-3xl p-8 border border-emergency/20">
                <h4 className="text-xl font-bold text-center mb-8 text-foreground">
                  {t('common.instantResponse')}
                </h4>
                
                {/* Response Steps */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emergency rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg">
                      1
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{t('common.voiceButtonActivation')}</h5>
                      <p className="text-xs text-muted-foreground">{t('common.helpCommand')}</p>
                    </div>
                    <Mic className="h-6 w-6 text-emergency" />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg">
                      2
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{t('common.locationAlert')}</h5>
                      <p className="text-xs text-muted-foreground">{t('common.gpsShared')}</p>
                    </div>
                    <Shield className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-wellness rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg">
                      3
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{t('common.emergencyContacts')}</h5>
                      <p className="text-xs text-muted-foreground">{t('common.familyNotified')}</p>
                    </div>
                    <Phone className="h-6 w-6 text-wellness" />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-guardian rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg">
                      4
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{t('common.professionalResponse')}</h5>
                      <p className="text-xs text-muted-foreground">{t('common.monitoringCenter')}</p>
                    </div>
                    <Users className="h-6 w-6 text-guardian" />
                  </div>
                </div>

                {/* Enhanced Response Metrics */}
                <div className="mt-8 bg-gradient-to-br from-white via-emergency/5 to-primary/5 rounded-xl p-6 border shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emergency mb-1">&lt; 15 sec</div>
                      <div className="text-xs text-muted-foreground">{t('common.aiDetection')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">&lt; 30 sec</div>
                      <div className="text-xs text-muted-foreground">{t('common.responseTime')}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-wellness">99.8%</div>
                      <div className="text-xs text-muted-foreground">{t('common.successRate')}</div>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-guardian">24/7</div>
                      <div className="text-xs text-muted-foreground">{t('common.monitoring')}</div>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <div className="text-lg font-bold text-emergency">180+</div>
                      <div className="text-xs text-muted-foreground">{t('common.countries')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 text-primary" />
                    <span>{t('common.professionalNetwork')}</span>
                  </div>
                </div>
              </div>

              {/* Floating Device Icons */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-full shadow-xl border-4 border-primary/20 flex items-center justify-center">
                <Speaker className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-full shadow-xl border-4 border-emergency/20 flex items-center justify-center">
                <Bluetooth className="h-8 w-8 text-emergency" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppPreviewSection;
