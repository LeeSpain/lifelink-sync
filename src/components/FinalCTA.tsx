import React from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const FinalCTA: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF4444]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-6 text-white">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-white/90 mb-10 font-inter leading-relaxed">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link to="/register">
                <Shield className="h-5 w-5 mr-2" />
                {t('cta.startFreeTrial')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
