import React from 'react';
import { Smartphone, Bot, ShieldCheck, PhoneCall, MapPin, Users, CheckCircle, AlertTriangle } from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-[#FAFAF9]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
            From SOS to safe — in seconds.
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-inter">
            Whether it's your 17-year-old daughter out at night or your mum at home alone —
            LifeLink Sync responds the same way. Instantly. Intelligently.
          </p>
        </div>

        {/* Visual Flow */}
        <div className="max-w-5xl mx-auto">
          {/* Step 1: SOS Trigger */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-poppins mb-2 text-[hsl(215,25%,27%)]">SOS Triggered</h3>
            <p className="text-gray-600 text-center max-w-md">
              App button or Bluetooth pendant — fires in under 3 seconds. No phone needed for pendant.
            </p>
          </div>

          {/* Connector */}
          <div className="flex justify-center mb-8">
            <div className="w-0.5 h-12 bg-gray-300" />
          </div>

          {/* Step 2: Clara Answers */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-poppins mb-2 text-[hsl(215,25%,27%)]">Clara Answers Instantly</h3>
            <p className="text-gray-600 text-center max-w-md">
              "Are you okay? I'm here." Clara, your AI safety companion, responds to every SOS immediately.
            </p>
          </div>

          {/* Connector */}
          <div className="flex justify-center mb-8">
            <div className="w-0.5 h-12 bg-gray-300" />
          </div>

          {/* Step 3: Clara Checks In */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-poppins mb-2 text-[hsl(215,25%,27%)]">Clara Checks In</h3>
            <p className="text-gray-600 text-center max-w-md">
              Clara assesses the situation through conversation — is this a false alarm or a real emergency?
            </p>
          </div>

          {/* Branch Split */}
          <div className="flex justify-center mb-8">
            <div className="w-0.5 h-8 bg-gray-300" />
          </div>

          {/* Two Branches */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Left Branch — False Alarm (Green) */}
            <div className="bg-wellness/5 border border-wellness/20 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-wellness/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-wellness" />
              </div>
              <h4 className="text-lg font-bold font-poppins mb-3 text-wellness">False Alarm</h4>
              <p className="text-gray-600 text-sm">
                Clara confirms you're safe. Incident logged quietly. No alerts sent to contacts. No fuss.
              </p>
            </div>

            {/* Right Branch — Real Emergency (Red tint) */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-primary" />
              </div>
              <h4 className="text-lg font-bold font-poppins mb-3 text-primary">Real Emergency</h4>
              <div className="text-gray-600 text-sm space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <PhoneCall className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>All emergency contacts called simultaneously</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Live GPS link sent to each contact</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>ETA shown — how long to reach you</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Tags */}
          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <span className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-600 shadow-sm">
              Teenager out at night
            </span>
            <span className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-600 shadow-sm">
              Elderly parent at home
            </span>
            <span className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-600 shadow-sm">
              Anyone — any age, any situation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
