import React from 'react';
import { Users, MapPin, Phone, Clock, Shield, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const benefitKeys = [
  'familySection.benefit1',
  'familySection.benefit2',
  'familySection.benefit3',
  'familySection.benefit4',
  'familySection.benefit5',
];

const FamilySection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section id="family" className="py-20 bg-[#F3F4F6]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-6 text-[hsl(215,25%,27%)]">
                {t('familySection.title')}
              </h2>
              <p className="text-lg text-gray-600 font-inter mb-8 leading-relaxed">
                {t('familySection.subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                {benefitKeys.map((key, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-gray-700 font-inter">{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Family dashboard mock card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold font-poppins text-[hsl(215,25%,27%)]">{t('familySection.dashboardTitle')}</h3>
                <span className="text-xs bg-wellness/10 text-wellness font-medium px-3 py-1 rounded-full">{t('familySection.allSafe')}</span>
              </div>

              {/* Mock family members */}
              {[
                { nameKey: 'familySection.memberMum', statusKey: 'familySection.statusHome', color: 'bg-wellness' },
                { nameKey: 'familySection.memberDad', statusKey: 'familySection.statusWork', color: 'bg-wellness' },
                { nameKey: 'familySection.memberSophie', statusKey: 'familySection.statusSchool', color: 'bg-wellness' },
                { nameKey: 'familySection.memberGran', statusKey: 'familySection.statusHome', color: 'bg-wellness' },
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center`}>
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[hsl(215,25%,27%)]">{t(member.nameKey)}</p>
                      <p className="text-xs text-gray-500">{t(member.statusKey)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-wellness rounded-full animate-pulse" />
                    <span className="text-xs text-wellness font-medium">{t('familySection.live')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FamilySection;
