import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Users, User } from "lucide-react";
import { Link } from "react-router-dom";
import { usePreferences } from '@/contexts/PreferencesContext';
import { convertCurrency, formatDisplayCurrency, languageToLocale } from '@/utils/currency';

export const PricingSection = () => {
  const { currency, language } = usePreferences();
  
  const memberPlanPrice = convertCurrency(9.99, 'EUR', currency);
  const familySeatPrice = convertCurrency(2.99, 'EUR', currency);
  const formattedMemberPrice = formatDisplayCurrency(memberPlanPrice, currency, languageToLocale(language));
  const formattedSeatPrice = formatDisplayCurrency(familySeatPrice, currency, languageToLocale(language));

  const pricingOptions = [
    {
      type: "Family Seat",
      icon: Users,
      price: formattedSeatPrice,
      period: "/month",
      description: "Owner pays for family member access",
      features: [
        "Full emergency coordination access",
        "Real-time SOS alerts & location",
        "Family emergency dashboard",
        "Emergency response tools",
        "Secure family communication",
        "No emergency contacts limit"
      ],
      popular: true,
      color: "primary",
      buttonText: "Add Family Member"
    },
    {
      type: "Independent Account",
      icon: User,
      price: formattedMemberPrice,
      period: "/month",
      description: "Family member pays for their own subscription",
      features: [
        "Full LifeLink Sync account",
        "5 personal emergency contacts",
        "All premium safety features",
        "Family emergency access",
        "Own emergency system",
        "Independent billing"
      ],
      popular: false,
      color: "wellness",
      buttonText: "Get Own Account"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-primary/10 rounded-full px-4 py-2 mb-4 border border-primary/20">
            <Users className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">Simple Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Transparent Family Access Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose how family members join your emergency network. No hidden fees, no long-term contracts.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {pricingOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card key={index} className={`relative ${option.popular ? 'border-primary shadow-primary/20 shadow-lg' : 'border-border'} transition-all duration-300 hover:shadow-lg`}>
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <div className={`w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                      option.color === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-wellness text-wellness-foreground'
                    }`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    
                    <CardTitle className="text-2xl mb-2">{option.type}</CardTitle>
                    <p className="text-muted-foreground mb-4">{option.description}</p>
                    
                    <div className="text-center">
                      <span className="text-4xl font-bold text-foreground">{option.price}</span>
                      <span className="text-muted-foreground">{option.period}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {option.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-wellness mr-3 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      asChild 
                      className={`w-full ${option.popular ? 'bg-primary hover:bg-primary/90' : 'bg-wellness hover:bg-wellness/90'} text-white`}
                      size="lg"
                    >
                      <Link to="/ai-register">
                        {option.buttonText}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              Both options provide full emergency coordination access. Choose based on who handles the billing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};