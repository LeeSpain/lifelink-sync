import React from 'react';
import { Phone, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const CallCentrePartner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 md:p-10">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="h-7 w-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h3 className="text-2xl font-bold font-poppins text-[hsl(215,25%,27%)]">
                    {t('landing.callCentre.title')}
                  </h3>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium">
                    {t('landing.callCentre.badge')}
                  </Badge>
                </div>
                <p className="text-gray-600 font-inter leading-relaxed mb-4">
                  {t('landing.callCentre.description')}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 font-inter">
                    {t('landing.callCentre.disclaimer')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallCentrePartner;
