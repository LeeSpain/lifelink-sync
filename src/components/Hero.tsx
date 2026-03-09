import { Button } from "@/components/ui/button";
import { Shield, Check, MapPin, Users, Activity, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import EcosystemMapModal from "@/components/landing/EcosystemMapModal";

interface HeroProps {
  onClaraClick?: () => void;
}

const HeroPhoneMockup = () => {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="relative mx-auto w-full rounded-[2.5rem] border-[6px] border-gray-900 bg-white shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-900" />

        {/* Status bar */}
        <div className="relative bg-gray-900 px-6 pt-8 pb-3 flex items-center justify-between text-white text-[10px]">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <span>100%</span>
          </div>
        </div>

        {/* Screen content */}
        <div className="px-5 pb-6">
          {/* App header */}
          <div className="text-center pt-4 pb-3">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">LS</span>
              </div>
              <span className="text-sm font-bold text-gray-900">LifeLink <span className="text-primary">Sync</span></span>
            </div>
            <p className="text-[10px] text-gray-400">{t('hero.alwaysThereReady')}</p>
          </div>

          {/* SOS Button */}
          <div className="flex flex-col items-center py-5">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <span
                className="absolute inset-0 rounded-full opacity-30 blur-md animate-pulse"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)' }}
              />
              <div className="relative h-20 w-20 rounded-full bg-primary shadow-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">SOS</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{t('hero.pressAndHold')}</p>
          </div>

          {/* Status cards */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900">Clara AI</div>
                <div className="text-[10px] text-gray-400">{t('hero.listeningReady')}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900">{t('hero.gpsLocation')}</div>
                <div className="text-[10px] text-gray-400">{t('hero.liveTrackingActive')}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900">{t('hero.familyCircle')}</div>
                <div className="text-[10px] text-gray-400">{t('hero.membersConnected')}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-24 h-1 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
};

const Hero = ({ onClaraClick }: HeroProps) => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[100dvh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#FAFAF9] pt-20 sm:pt-16">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(#DC2626 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute top-20 right-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 leading-tight text-[hsl(215,25%,27%)]">
              {t('hero.alwaysThere')}{' '}
              <span className="text-primary">{t('hero.alwaysReady')}</span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed font-inter">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button
                asChild
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
              >
                <Link to="/register">
                  <Shield className="h-5 w-5 mr-2" />
                  {t('hero.startFreeTrial')}
                </Link>
              </Button>

              <EcosystemMapModal
                trigger={
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 font-semibold text-lg px-8 py-6 rounded-xl transition-all duration-300"
                  >
                    {t('hero.seeHowItWorks')}
                  </Button>
                }
              />
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-wellness" />
                <span>{t('hero.freeTrial')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-wellness" />
                <span>{t('hero.noContract')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-wellness" />
                <span>{t('hero.cancelAnytime')}</span>
              </div>
            </div>
          </div>

          {/* Hero Phone Mockup */}
          <div className="relative">
            <div className="relative z-10">
              <HeroPhoneMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
