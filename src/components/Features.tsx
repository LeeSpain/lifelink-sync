import React from 'react';
import { Smartphone, Bot, MapPin, Users, Bluetooth, LayoutDashboard } from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'One-Touch SOS',
    description: 'App button or Bluetooth pendant — fires in under 3 seconds. Instant activation, no fumbling.',
  },
  {
    icon: Bot,
    title: 'Clara AI',
    description: 'Your safety companion. Clara answers every SOS call, assesses the situation, and coordinates the response.',
  },
  {
    icon: MapPin,
    title: 'Live Location Sharing',
    description: 'GPS coordinates and ETA sent to every emergency contact in real time. Know exactly where help is needed.',
  },
  {
    icon: Users,
    title: 'Family Response Network',
    description: 'Up to 10 contacts coordinated simultaneously. Everyone notified at once — calls, messages, and live map.',
  },
  {
    icon: Bluetooth,
    title: 'Bluetooth SOS Pendant',
    description: 'Wearable emergency button. No phone needed to trigger a full platform response. Ideal for elderly users.',
  },
  {
    icon: LayoutDashboard,
    title: 'Member & Family Dashboards',
    description: 'The right view for every role. Individual member view, family coordination view, and admin operations.',
  },
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-[#F3F4F6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
            Every layer of protection, built in.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            A complete emergency protection platform — not just an app.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-[hsl(215,25%,27%)]">
                {feature.title}
              </h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
