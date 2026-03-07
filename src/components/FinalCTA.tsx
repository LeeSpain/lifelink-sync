import React from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF4444]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-6 text-white">
            Start protecting your family today.
          </h2>
          <p className="text-lg text-white/90 mb-10 font-inter leading-relaxed">
            Join thousands of families who trust LifeLink Sync — because when a moment matters,
            you need to know someone is already there.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link to="/ai-register">
                <Shield className="h-5 w-5 mr-2" />
                Start Free Trial
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 py-6 rounded-xl transition-all duration-300"
            >
              <Link to="/contact">
                Book a Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
