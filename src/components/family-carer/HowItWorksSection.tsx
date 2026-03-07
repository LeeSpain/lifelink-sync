import React from 'react';
import { Button } from "@/components/ui/button";
import { Send, Mail, Smartphone, CircleCheck, ArrowRight, ArrowDown } from "lucide-react";

export const HowItWorksSection = () => {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-background"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.05)_50%,transparent_100%)]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            From Setup to 
            <span className="bg-gradient-to-r from-primary via-emergency to-wellness bg-clip-text text-transparent"> Protection</span>
          </h2>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Professional emergency coordination in 4 simple steps. No technical knowledge required.
          </p>
        </div>
        
        {/* Interactive Timeline */}
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-wellness to-emergency rounded-full transform -translate-y-1/2 hidden lg:block"></div>
            
            {/* Steps */}
            <div className="grid lg:grid-cols-4 gap-12 lg:gap-8">
              
              {/* Step 1 */}
              <div className="relative group">
                <div className="text-center">
                  <div className="relative z-10 mx-auto w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8 shadow-primary group-hover:shadow-xl transition-all duration-500 hover-scale">
                    <Send className="h-12 w-12 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Send Invite</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Enter family member's email in your dashboard. Secure invitation sent instantly.
                  </p>
                </div>
                <div className="hidden lg:block absolute top-12 -right-4 text-primary">
                  <ArrowRight className="h-8 w-8" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="text-center">
                  <div className="relative z-10 mx-auto w-24 h-24 bg-wellness rounded-3xl flex items-center justify-center mb-8 shadow-primary group-hover:shadow-xl transition-all duration-500 hover-scale">
                    <Mail className="h-12 w-12 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">They Register</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Family member receives email, creates secure account in minutes.
                  </p>
                </div>
                <div className="hidden lg:block absolute top-12 -right-4 text-wellness">
                  <ArrowRight className="h-8 w-8" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="text-center">
                  <div className="relative z-10 mx-auto w-24 h-24 bg-guardian rounded-3xl flex items-center justify-center mb-8 shadow-primary group-hover:shadow-xl transition-all duration-500 hover-scale">
                    <Smartphone className="h-12 w-12 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Download App</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Mobile app download and emergency notification permissions setup.
                  </p>
                </div>
                <div className="hidden lg:block absolute top-12 -right-4 text-guardian">
                  <ArrowRight className="h-8 w-8" />
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="text-center">
                  <div className="relative z-10 mx-auto w-24 h-24 bg-emergency rounded-3xl flex items-center justify-center mb-8 shadow-primary group-hover:shadow-xl transition-all duration-500 hover-scale emergency-pulse">
                    <CircleCheck className="h-12 w-12 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Protected</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Live emergency coordination established. Family instantly connected.
                  </p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Result Showcase */}
          <div className="mt-20 text-center">
            <div className="flex justify-center mb-8">
              <ArrowDown className="h-12 w-12 text-emergency animate-bounce" />
            </div>
            
            <div className="bg-gradient-to-r from-emergency/10 via-primary/10 to-wellness/10 rounded-3xl p-12 border border-primary/20">
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Result: Professional Emergency Network
              </h3>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-emergency mb-2">{"<"}5s</div>
                  <p className="text-muted-foreground">Emergency alert delivery</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">GPS</div>
                  <p className="text-muted-foreground">Precise location sharing</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-wellness mb-2">24/7</div>
                  <p className="text-muted-foreground">Family coordination ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};