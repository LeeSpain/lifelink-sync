import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";
import { getImageSizes, generateBlurPlaceholder } from "@/utils/imageOptimization";

const heroImage = '/lovable-uploads/141f77cc-c074-48dc-95f1-f886baacd2da.png?v=1';

interface HeroProps {
  onClaraClick?: () => void;
}

const Hero = ({ onClaraClick }: HeroProps) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#FAFAF9] pt-16">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(#DC2626 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 leading-tight text-[hsl(215,25%,27%)]">
              Always There.{' '}
              <span className="text-primary">Always Ready.</span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed font-inter">
              One-touch SOS. Clara answers instantly. Your family coordinated.
              Protection for everyone, at every age.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button
                asChild
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
              >
                <Link to="/ai-register">
                  <Shield className="h-5 w-5 mr-2" />
                  Start Free Trial
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5 font-semibold text-lg px-8 py-6 rounded-xl transition-all duration-300"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-wellness" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-wellness" />
                <span>No contract</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-wellness" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image — app card mockup */}
          <div className="relative">
            <div className="relative z-10">
              <OptimizedImage
                src={heroImage}
                alt="LifeLink Sync app showing SOS button, Clara AI status, and GPS alert"
                className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl"
                priority={true}
                sizes={getImageSizes('hero')}
                blurDataURL={generateBlurPlaceholder(400, 600)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
