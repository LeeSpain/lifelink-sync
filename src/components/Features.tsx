import React from 'react';
import { Smartphone, Bot, MapPin, Users, Bluetooth, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const featureItems = [
  { icon: Smartphone, titleKey: 'landing.features.oneTouchSosTitle', descKey: 'landing.features.oneTouchSosDesc' },
  { icon: Bot, titleKey: 'landing.features.claraAiTitle', descKey: 'landing.features.claraAiDesc' },
  { icon: MapPin, titleKey: 'landing.features.liveLocationTitle', descKey: 'landing.features.liveLocationDesc' },
  { icon: Users, titleKey: 'landing.features.familyNetworkTitle', descKey: 'landing.features.familyNetworkDesc' },
  { icon: Bluetooth, titleKey: 'landing.features.pendantTitle', descKey: 'landing.features.pendantDesc' },
  { icon: LayoutDashboard, titleKey: 'landing.features.dashboardsTitle', descKey: 'landing.features.dashboardsDesc' },
];

const Features: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-20 bg-[#F3F4F6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
            {t('landing.features.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {featureItems.map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-[hsl(215,25%,27%)]">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
