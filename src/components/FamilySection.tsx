import React from 'react';
import { Users, MapPin, Phone, Clock, Shield, Check } from 'lucide-react';

const benefits = [
  'Family coordination dashboard',
  'Role-based alerts for every member',
  'GPS with live travel time to reach you',
  'Conference bridge for multi-party calls',
  'Full incident timeline and history',
];

const FamilySection: React.FC = () => {
  return (
    <section id="family" className="py-20 bg-[#F3F4F6]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-6 text-[hsl(215,25%,27%)]">
                Protect the people who matter most.
              </h2>
              <p className="text-lg text-gray-600 font-inter mb-8 leading-relaxed">
                One account, whole family covered — mum, teenager, gran, dad. Everyone protected,
                everyone connected, everyone coordinated.
              </p>

              <div className="space-y-4 mb-8">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-gray-700 font-inter">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Family dashboard mock card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold font-poppins text-[hsl(215,25%,27%)]">Family Dashboard</h3>
                <span className="text-xs bg-wellness/10 text-wellness font-medium px-3 py-1 rounded-full">All Safe</span>
              </div>

              {/* Mock family members */}
              {[
                { name: 'Mum', status: 'Home', color: 'bg-wellness' },
                { name: 'Dad', status: 'Work — 2.4km away', color: 'bg-wellness' },
                { name: 'Sophie', status: 'School — 1.1km away', color: 'bg-wellness' },
                { name: 'Gran', status: 'Home', color: 'bg-wellness' },
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center`}>
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[hsl(215,25%,27%)]">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-wellness rounded-full animate-pulse" />
                    <span className="text-xs text-wellness font-medium">Live</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FamilySection;
