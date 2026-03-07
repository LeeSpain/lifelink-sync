import React from 'react';
import { Phone, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CallCentrePartner: React.FC = () => {
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
                    Professional Call Centre Support
                  </h3>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium">
                    Spain &middot; Regional Partner
                  </Badge>
                </div>
                <p className="text-gray-600 font-inter leading-relaxed mb-4">
                  Optional add-on via a trusted Spanish partner. 24/7 staffed professional call centre,
                  separate from the LifeLink Sync app. Available to members based in Spain.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 font-inter">
                    This service is provided by an independent partner and is available to members based
                    in Spain only. It operates alongside — not as part of — the LifeLink Sync app.
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
