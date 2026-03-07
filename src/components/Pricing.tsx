import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Shield, Users, Heart, Pill, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface AddOnProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  badge?: string;
}

const AddOnCard: React.FC<AddOnProps> = ({ name, price, description, features, icon, badge }) => (
  <div className="rounded-xl p-6 border border-[#E5E7EB] bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-primary">{icon}</div>
      <h4 className="text-lg font-bold font-poppins text-[hsl(215,25%,27%)]">{name}</h4>
      {badge && (
        <Badge className="bg-green-100 text-green-800 text-xs">{badge}</Badge>
      )}
    </div>
    <div className="flex items-baseline gap-1 mb-3">
      <span className="text-2xl font-bold font-poppins text-primary">{price}</span>
      <span className="text-sm text-gray-500">/mo</span>
    </div>
    <p className="text-sm text-gray-500 mb-4">{description}</p>
    <div className="space-y-2">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-wellness" />
          <span className="text-xs text-gray-600">{feature}</span>
        </div>
      ))}
    </div>
  </div>
);

const Pricing: React.FC = () => {
  const basePlanFeatures = [
    'SOS activation (app)',
    'Clara AI 24/7',
    'Live location sharing',
    '1 emergency contact',
    'Incident log',
    '1 free Family Link',
  ];

  const addOns: AddOnProps[] = [
    {
      name: 'Family Link',
      price: '\u20AC2.99',
      description: 'Add family members to your protection circle.',
      features: [
        'Live SOS alerts',
        'Shared map',
        'Received & On It acknowledgment',
      ],
      icon: <Users className="h-5 w-5" />,
      badge: '1st FREE',
    },
    {
      name: 'Daily Wellbeing',
      price: '\u20AC2.99',
      description: 'Daily wellness check-ins powered by CLARA AI.',
      features: [
        'Daily check-in prompts',
        'Mood tracking',
        'Wellness reports',
      ],
      icon: <Heart className="h-5 w-5" />,
    },
    {
      name: 'Medication Reminder',
      price: '\u20AC2.99',
      description: 'Smart medication reminders with tracking.',
      features: [
        'Custom schedules',
        'Missed dose alerts',
        'Compliance reports',
      ],
      icon: <Pill className="h-5 w-5" />,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
            Protection for every budget.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            7-day free trial. No card required to start.
          </p>
        </div>

        {/* Base Plan */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="rounded-2xl p-5 sm:p-8 bg-[hsl(215,28%,17%)] text-white border-primary shadow-xl">
            <Badge className="bg-primary text-white text-xs font-medium mb-4">
              Base Plan
            </Badge>
            <h3 className="text-2xl font-bold font-poppins mb-2 text-white">Individual</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold font-poppins text-primary">&euro;9.99</span>
              <span className="text-sm text-gray-400">/mo</span>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Essential protection for one person. Everything you need to stay safe.
            </p>
            <div className="space-y-3 mb-8">
              {basePlanFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="text-sm text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
            <Button asChild className="w-full font-semibold py-6 bg-primary text-white hover:bg-primary/90">
              <Link to="/trial-signup">
                <Shield className="h-4 w-4 mr-2" />
                Start 7-Day Free Trial
              </Link>
            </Button>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-2xl font-bold font-poppins text-center mb-2 text-[hsl(215,25%,27%)]">
            Customise with Add-Ons
          </h3>
          <p className="text-center text-gray-500 mb-8">
            Enhance your protection with modular add-ons. Add or remove anytime.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {addOns.map((addon, i) => (
              <AddOnCard key={i} {...addon} />
            ))}
          </div>

          {/* CLARA Complete Banner */}
          <div className="rounded-xl p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-bold font-poppins text-purple-900">CLARA Complete</h4>
              <Badge className="bg-green-100 text-green-800">FREE</Badge>
            </div>
            <p className="text-sm text-purple-700 max-w-lg mx-auto">
              Automatically unlocked when you activate both <strong>Daily Wellbeing</strong> and{' '}
              <strong>Medication Reminder</strong>. Full CLARA AI experience at no extra cost.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          Professional call centre support (Spain only) is available as a separate add-on
          via our regional partner. Not included in any plan by default.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
