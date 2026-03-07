import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, Heart, Building, ArrowRight, Check } from "lucide-react";

export const AccessLevelsSection = () => {
  return (
    <section className="py-32 bg-gradient-to-b from-muted/30 via-background to-muted/30 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.1)_0%,transparent_50%)] "></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1)_0%,transparent_50%)] "></div>
      
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Your
            <span className="bg-gradient-to-r from-primary via-emergency to-wellness bg-clip-text text-transparent"> Support Network</span>
          </h2>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Grant the right level of emergency access to everyone in your circle of care
          </p>
        </div>

        {/* Interactive Access Levels */}
        <div className="max-w-7xl mx-auto">
          
          {/* Family Members - Primary */}
          <div className="mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-wellness/20 rounded-3xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 border border-primary/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">Family Members</h3>
                        <p className="text-muted-foreground">Your closest support network</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground px-4 py-2">Most Common</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span className="text-foreground">Instant SOS alerts</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span className="text-foreground">Real-time emergency location</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span className="text-foreground">Family coordination dashboard</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span className="text-foreground">Emergency response tools</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span className="text-foreground">Two-way communication</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-primary mr-3" />
                        <span className="text-foreground">Full emergency coordination</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <h4 className="text-3xl font-bold text-foreground mb-4">Complete Emergency Access</h4>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Your family gets instant alerts when you trigger SOS, sees your exact location, 
                    and can coordinate response with other family members in real-time.
                  </p>
                </div>
                
                {/* Pricing highlight */}
                <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-primary">€2.99/month</div>
                      <p className="text-muted-foreground">per family member</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Network */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Trusted Friends */}
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-wellness/20 to-wellness/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-wellness/10 to-wellness/5 rounded-2xl p-6 border border-wellness/20 hover:border-wellness/40 transition-all duration-500 h-full">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-wellness rounded-xl flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Trusted Friends</h4>
                    <Badge className="bg-wellness text-wellness-foreground">Flexible</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">Close friends who can help in emergency situations</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-wellness rounded-full mr-2"></div>
                    <span>Emergency notifications</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-wellness rounded-full mr-2"></div>
                    <span>Location during SOS</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-wellness rounded-full mr-2"></div>
                    <span>Response coordination</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Carers */}
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-guardian/20 to-guardian/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-guardian/10 to-guardian/5 rounded-2xl p-6 border border-guardian/20 hover:border-guardian/40 transition-all duration-500 h-full">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-guardian rounded-xl flex items-center justify-center">
                    <UserCog className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Professional Carers</h4>
                    <Badge className="bg-guardian text-guardian-foreground">Professional</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">Healthcare workers, caregivers, professional services</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-guardian rounded-full mr-2"></div>
                    <span>Professional protocols</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-guardian rounded-full mr-2"></div>
                    <span>Medical information access</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-guardian rounded-full mr-2"></div>
                    <span>Care coordination tools</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Services */}
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-emergency/20 to-emergency/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-emergency/10 to-emergency/5 rounded-2xl p-6 border border-emergency/20 hover:border-emergency/40 transition-all duration-500 h-full">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-emergency rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Regional Services</h4>
                    <Badge className="bg-emergency text-emergency-foreground">Advanced</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">Local emergency services and community support</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-emergency rounded-full mr-2"></div>
                    <span>Regional integration</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-emergency rounded-full mr-2"></div>
                    <span>Local service coordination</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-emergency rounded-full mr-2"></div>
                    <span>Community networks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-r from-guardian/10 via-primary/10 to-wellness/10 rounded-3xl p-8 border border-primary/20">
              <h4 className="text-2xl font-bold text-foreground mb-4">
                One System, Multiple Access Levels
              </h4>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Grant appropriate emergency access to everyone in your support network. 
                From family to professionals, everyone gets the right level of access for effective coordination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};