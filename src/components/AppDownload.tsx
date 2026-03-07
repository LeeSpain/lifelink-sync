import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Smartphone, Brain, MessageCircle, Zap, Star, Phone, Mic, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { IntroVideoModal } from "@/components/IntroVideoModal";
import { useClaraChat } from "@/contexts/ClaraChatContext";
import { useTranslation } from 'react-i18next';

const AppDownload = () => {
  const { t } = useTranslation();
  const { openClaraChat } = useClaraChat();
  return (
    <section className="py-section bg-gradient-to-br from-primary/5 via-secondary/5 to-wellness/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black bg-white p-4 rounded-lg shadow-sm mb-4 inline-block">
            {t('appDownload.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('appDownload.subtitle')}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Clara AI Visual */}
            <div className="relative">
              {/* AI Chat Interface Mockup */}
              <div className="relative mx-auto w-80 h-[600px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-white to-gray-50 rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <span className="font-bold">Clara AI</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                      <span className="ml-2 text-xs">100%</span>
                      <div className="w-6 h-3 border border-white rounded-sm bg-white/20 ml-1"></div>
                    </div>
                  </div>

                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Clara</p>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600">{t('common.activeNow')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                          <Phone className="h-3 w-3 text-gray-600" />
                        </div>
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center">
                          <MessageCircle className="h-3 w-3 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-4 space-y-4 overflow-hidden">
                    {/* Welcome Message */}
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl rounded-tl-sm p-3 max-w-[200px] shadow-sm border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-1">Clara AI</p>
                        <p className="text-sm text-gray-800">👋 Hi! I'm Clara, your intelligent AI assistant. I'm here to help with emergency setup, family connections, and answer any questions!</p>
                        <p className="text-xs text-gray-500 mt-2">{t('common.justNow')}</p>
                      </div>
                    </div>

                    {/* Feature Showcase Message */}
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-gradient-to-r from-secondary/10 to-wellness/10 rounded-2xl rounded-tl-sm p-3 max-w-[200px] shadow-sm border border-secondary/20">
                        <p className="text-xs font-medium text-secondary mb-1">Smart Features</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-primary" />
                            <span>Emergency Setup</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="h-3 w-3 text-secondary" />
                            <span>Family Management</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <MessageCircle className="h-3 w-3 text-wellness" />
                            <span>24/7 Support</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t('common.justNow')}</p>
                      </div>
                    </div>

                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl rounded-tr-sm p-3 max-w-[180px] shadow-sm">
                        <p className="text-sm">How do I set up family members?</p>
                        <p className="text-xs text-white/80 mt-1">{t('common.justNow')}</p>
                      </div>
                    </div>

                    {/* Clara's Response with Typing */}
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl rounded-tl-sm p-3 max-w-[200px] shadow-sm border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-1">Clara AI</p>
                        <p className="text-sm text-gray-800">I'll guide you through adding family members step by step. It's really simple! 🚀</p>
                        <div className="mt-3 flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 text-sm text-gray-500">{t('common.typeMessage')}</div>
                      <div className="flex items-center space-x-2">
                        <Mic className="h-4 w-4 text-primary cursor-pointer" />
                        <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center cursor-pointer">
                          <span className="text-white text-xs">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating AI Features */}
              <div className="absolute -left-8 top-20 bg-white rounded-xl p-4 shadow-xl border border-primary/20 max-w-48">
                <div className="flex items-center mb-2">
                  <MessageCircle className="h-4 w-4 text-primary mr-2" />
                  <span className="font-semibold text-sm">Natural Language</span>
                </div>
                <p className="text-xs text-gray-600">Speaks your language naturally</p>
              </div>

              <div className="absolute -right-8 bottom-32 bg-white rounded-xl p-4 shadow-xl border border-secondary/20 max-w-48">
                <div className="flex items-center mb-2">
                  <Zap className="h-4 w-4 text-secondary mr-2" />
                  <span className="font-semibold text-sm">Instant Response</span>
                </div>
                <p className="text-xs text-gray-600">24/7 immediate assistance</p>
              </div>
            </div>

            {/* Right Side - AI Features & CTA */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  {t('appDownload.appName')}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {t('appDownload.heroDescription')}
                </p>
              </div>

              <div className="grid gap-6 mb-8">
                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('appDownload.features.intelligentSupport.title')}</h4>
                    <p className="text-muted-foreground">{t('appDownload.features.intelligentSupport.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('appDownload.features.learningAI.title')}</h4>
                    <p className="text-muted-foreground">{t('appDownload.features.learningAI.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 text-left">
                  <div className="w-12 h-12 bg-gradient-to-br from-wellness/10 to-wellness/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-wellness" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{t('appDownload.features.instantResponse.title')}</h4>
                    <p className="text-muted-foreground">{t('appDownload.features.instantResponse.description')}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-xl shadow-lg -z-10"></div>
                  <Button 
                    size="xl" 
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold px-8 py-4 shadow-glow hover:shadow-xl transition-all duration-300 rounded-xl relative z-10"
                    onClick={openClaraChat}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {t('appDownload.cta')}
                  </Button>
                </div>
                <IntroVideoModal 
                  defaultVideoId="meet-clara"
                  trigger={
                    <Button 
                      size="xl" 
                      variant="outline"
                      className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        {t('common.watchVideo')}
                      </Button>
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('common.aiFeatures')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;