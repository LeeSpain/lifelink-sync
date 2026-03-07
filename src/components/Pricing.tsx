import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface PlanProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const PlanCard: React.FC<PlanProps> = ({ name, price, description, features, highlighted, badge }) => (
  <div className={`rounded-2xl p-8 border transition-shadow duration-300 ${
    highlighted
      ? 'bg-[hsl(215,28%,17%)] text-white border-primary shadow-xl scale-[1.02]'
      : 'bg-white text-[hsl(215,25%,27%)] border-[#E5E7EB] shadow-sm hover:shadow-lg'
  }`}>
    {badge && (
      <Badge className="bg-primary text-white text-xs font-medium mb-4">
        {badge}
      </Badge>
    )}
    <h3 className={`text-2xl font-bold font-poppins mb-2 ${highlighted ? 'text-white' : ''}`}>
      {name}
    </h3>
    <div className="flex items-baseline gap-1 mb-4">
      <span className={`text-4xl font-bold font-poppins ${highlighted ? 'text-primary' : 'text-primary'}`}>
        {price}
      </span>
      <span className={`text-sm ${highlighted ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
    </div>
    <p className={`text-sm mb-6 ${highlighted ? 'text-gray-300' : 'text-gray-500'}`}>
      {description}
    </p>
    <div className="space-y-3 mb-8">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${highlighted ? 'text-primary' : 'text-wellness'}`} />
          <span className={`text-sm ${highlighted ? 'text-gray-200' : 'text-gray-600'}`}>{feature}</span>
        </div>
      ))}
    </div>
    <Button
      asChild
      className={`w-full font-semibold py-6 ${
        highlighted
          ? 'bg-primary text-white hover:bg-primary/90'
          : 'bg-primary text-white hover:bg-primary/90'
      }`}
    >
      <Link to="/ai-register">
        <Shield className="h-4 w-4 mr-2" />
        Start Free Trial
      </Link>
    </Button>
  </div>
);

const Pricing: React.FC = () => {
  const plans: PlanProps[] = [
    {
      name: 'Individual',
      price: '\u20AC9.99',
      description: 'Essential protection for one person.',
      features: [
        'SOS activation (app)',
        'Clara AI 24/7',
        'Live location sharing',
        '1 emergency contact',
        'Incident log',
      ],
    },
    {
      name: 'Family',
      price: '\u20AC19.99',
      description: 'Complete protection for the whole family.',
      features: [
        'Everything in Individual',
        'Up to 10 family contacts',
        'Family coordination dashboard',
        'Bluetooth pendant support',
        'Conference bridge alerts',
      ],
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Professional',
      price: '\u20AC39.99',
      description: 'For organisations and care providers.',
      features: [
        'Everything in Family',
        'Admin operations dashboard',
        'Multi-user management',
        'Advanced incident reporting',
        'Priority support',
      ],
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
            14-day free trial on all plans. No card required to start.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-8">
          {plans.map((plan, i) => (
            <PlanCard key={i} {...plan} />
          ))}
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
