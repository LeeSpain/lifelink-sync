import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Shield, Clock, CheckCircle, ArrowRight, Phone, Heart, Star } from "lucide-react";

export const CallToActionSection = () => {
  return (
    <section className="py-32 bg-gradient-hero relative overflow-hidden">
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-wellness/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emergency/20 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Main CTA */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Protect Your Family
              <br />
              <span className="bg-gradient-to-r from-wellness via-white to-emergency-glow bg-clip-text text-transparent">
                Starting Today
              </span>
            </h2>
            <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Professional emergency coordination that works when seconds count. 
              Your family deserves more than just peace of mind.
            </p>
            
            <div className="flex flex-col lg:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                asChild 
                size="xl" 
                className="bg-wellness text-black hover:bg-wellness/90 shadow-glow font-bold text-2xl px-16 py-8 rounded-2xl hover-scale"
              >
                <Link to="/ai-register">
                  <UserPlus className="mr-4 h-8 w-8" />
                  Start Protecting Your Family
                  <ArrowRight className="ml-4 h-8 w-8" />
                </Link>
              </Button>
              
              <div className="flex items-center space-x-3 text-white/80">
                <div className="w-2 h-2 bg-wellness rounded-full animate-pulse"></div>
                <span className="font-medium">5-minute setup • No contracts • 30-day guarantee</span>
              </div>
            </div>
          </div>

          {/* Trust Indicators Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            
            {/* Privacy */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 group-hover:scale-110 transition-all duration-300">
                <Shield className="h-10 w-10 text-wellness" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Privacy Protected</h3>
              <p className="text-white/80 text-lg">
                Zero tracking outside emergencies. Your family's privacy is completely protected.
              </p>
            </div>

            {/* Speed */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 group-hover:scale-110 transition-all duration-300">
                <Clock className="h-10 w-10 text-emergency-glow" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-white/80 text-lg">
                Sub-5-second emergency alerts. When it matters most, speed saves lives.
              </p>
            </div>

            {/* Guarantee */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 group-hover:scale-110 transition-all duration-300">
                <CheckCircle className="h-10 w-10 text-wellness" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Risk-Free Trial</h3>
              <p className="text-white/80 text-lg">
                30-day money-back guarantee. Experience the difference with zero risk.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center mb-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <div className="flex items-center justify-center space-x-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-wellness fill-current" />
                ))}
                <span className="text-white font-bold text-xl ml-4">4.9/5</span>
              </div>
              <p className="text-xl text-white/90 mb-4">
                "LifeLink Sync gave our family the emergency coordination we needed. When dad had his fall, 
                we all knew instantly and could respond together."
              </p>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-wellness rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold">Sarah M.</div>
                  <div className="text-white/60 text-sm">Family Member, Barcelona</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="text-center">
            <p className="text-white/60 text-lg mb-6">
              Need help choosing the right plan for your family?
            </p>
            <Button 
              asChild
              variant="outline"
              size="lg"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-lg px-8 backdrop-blur-sm"
            >
              <Link to="/contact">
                <Phone className="h-5 w-5 mr-2" />
                Talk to a Family Safety Expert
              </Link>
            </Button>
          </div>

          {/* Final Trust Line */}
          <div className="text-center mt-12">
            <p className="text-white/40 text-sm">
              Trusted by thousands of families across Europe • GDPR Compliant • Professional Grade Security
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};