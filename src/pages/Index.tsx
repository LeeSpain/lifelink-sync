import React, { useEffect, useState } from 'react';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import HowItAllConnectsModal from "@/components/dashboard/HowItAllConnectsModal";
import CallCentrePartner from "@/components/CallCentrePartner";
import FamilySection from "@/components/FamilySection";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import PendantPromo from "@/components/PendantPromo";
import Footer from "@/components/Footer";
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PageSEO } from '@/components/PageSEO';
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { preloadCriticalImages } from "@/utils/imageOptimization";
import { useClaraChat } from "@/contexts/ClaraChatContext";
import StructuredData from '@/components/StructuredData';
import AIBusinessProfile from '@/components/AIBusinessProfile';
import BusinessAPIEndpoints from '@/components/BusinessAPIEndpoints';
import AIContentDiscovery from '@/components/AIContentDiscovery';
import EnhancedRobotsTxt from '@/components/EnhancedRobotsTxt';
import EnhancedSitemapGenerator from '@/components/EnhancedSitemapGenerator';
import { softwareApplicationSchema, faqSchemaHomepage, localBusinessSchema } from '@/lib/seoSchemas';

const Index = () => {
  useScrollToTop();
  usePerformanceMonitoring();
  const { openClaraChat } = useClaraChat();
  const [showEcosystem, setShowEcosystem] = useState(false);

  useEffect(() => {
    preloadCriticalImages();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageSEO pageType="home" />
      <StructuredData type="Organization" />
      <AIBusinessProfile />
      <BusinessAPIEndpoints />
      <AIContentDiscovery pageType="home" />
      <EnhancedRobotsTxt />
      <EnhancedSitemapGenerator />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaHomepage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <Navigation />

      {/* 1. Hero */}
      <Hero onClaraClick={openClaraChat} />

      {/* 2. Stats Bar */}
      <StatsBar />

      {/* 3. How It Works — Clara journey */}
      <HowItWorks />

      {/* 4. Platform Features */}
      <Features />

      {/* 4b. Ecosystem Map */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <button
            onClick={() => setShowEcosystem(true)}
            className="border border-primary text-primary hover:bg-primary/5 font-semibold px-8 py-3 rounded-xl transition-all duration-300"
          >
            See How It All Connects
          </button>
        </div>
      </section>
      <HowItAllConnectsModal
        isOpen={showEcosystem}
        onClose={() => setShowEcosystem(false)}
      />

      {/* 5. Call Centre Partner */}
      <CallCentrePartner />

      {/* 6. Family Section */}
      <FamilySection />

      {/* 7. Pricing */}
      <Pricing />

      {/* 8. Pendant Promo */}
      <PendantPromo />

      {/* 9. CTA Banner */}
      <FinalCTA />

      {/* 10. Footer */}
      <Footer />
    </div>
  );
};

export default Index;
