import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, Bluetooth, Battery, Droplets, MapPin, Shield, PhoneCall, CheckCircle2, Smartphone, Zap, Clock, Heart, Star, Users, Globe, Phone, Play } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/ui/optimized-image";
import { getImageSizes, generateBlurPlaceholder } from "@/utils/imageOptimization";
import { IntroVideoModal } from "@/components/IntroVideoModal";

const DeviceIceSosPendant = () => {
  console.log('[DeviceIceSosPendant] Component rendering started');
  const { t } = useTranslation();
  const [comingSoon, setComingSoon] = useState(false);
  const title = t('devices.icePendant.seoTitle', { defaultValue: 'LifeLink Sync Bluetooth Pendant – LifeLink Sync' });
  const description = t('devices.icePendant.metaDescription', { defaultValue: 'Hands-free emergency pendant with Bluetooth, waterproof design, and 7-day battery. Works with LifeLink Sync app.' });
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/devices/lifelink-sync-pendant` : "https://example.com/devices/lifelink-sync-pendant";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "LifeLink Sync Bluetooth Pendant (LifeLink Sync)",
    brand: {
      "@type": "Brand",
      name: "LifeLink Sync"
    },
    description,
    image: typeof window !== "undefined" ? `${window.location.origin}/lovable-uploads/acfcc77a-7e34-44f5-8487-4069c2acb56b.png` : "",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: "64.98",
      availability: "https://schema.org/InStock",
      url: canonical,
      description: "LifeLink Sync Bluetooth Pendant €59.99 + €4.99 shipping"
    }
  };

  React.useEffect(() => {
    console.log('[DeviceIceSosPendant] useEffect running - fetching product status');
    const fetchStatus = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('status')
          .eq('name', 'LifeLink Sync Bluetooth Pendant')
          .maybeSingle();
        console.log('[DeviceIceSosPendant] Product status data:', data);
        if (data?.status === 'coming_soon') setComingSoon(true);
      } catch (error) {
        console.error('[DeviceIceSosPendant] Error fetching product status:', error);
      }
    };
    fetchStatus();
  }, []);

  const features = [
    { icon: Bluetooth, text: "Bluetooth 5.0 Low Energy – instant pairing" },
    { icon: Droplets, text: "IP67 waterproof for daily wear" },
    { icon: Battery, text: "More than 7 days battery life" },
    { icon: MapPin, text: "100m range from smartphone" }
  ];

  console.log('[DeviceIceSosPendant] Rendering with comingSoon:', comingSoon);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16 md:pt-20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={typeof window !== "undefined" ? `${window.location.origin}/lovable-uploads/acfcc77a-7e34-44f5-8487-4069c2acb56b.png` : ""} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-hero shadow-2xl mb-4">
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left text-white">
              <div className="inline-flex items-center space-x-2 bg-emergency/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg border border-emergency/30">
                <Shield className="h-4 w-4 text-emergency-glow" />
                <span className="text-sm font-medium text-white">24/7 Professional Response</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
                LifeLink Sync Emergency <span className="text-wellness drop-shadow-md">Bluetooth Pendant</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-white leading-relaxed font-medium drop-shadow-sm">
                Hands-free emergency protection with smart home integration. One button calls ALL your emergency contacts instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                {comingSoon ? (
                  <Badge className="px-6 py-3 text-lg font-semibold bg-secondary text-white">Coming Soon</Badge>
                ) : (
                  <Button 
                    asChild 
                    size="xl" 
                    className="bg-wellness text-black hover:bg-wellness/90 shadow-glow hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-wellness/20"
                  >
                    <Link to="/ai-register">Join Now</Link>
                  </Button>
                )}
                <IntroVideoModal 
                  defaultVideoId="ice-pendant-demo"
                  trigger={
                    <Button 
                      size="xl" 
                      className="bg-wellness text-black hover:bg-wellness/90 shadow-glow hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-wellness/20"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Watch Video
                    </Button>
                  }
                />
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <OptimizedImage 
                  src="/lovable-uploads/a5d9b9a3-71f8-4e05-b21b-2f2bc801fbc8.png" 
                  alt="LifeLink Sync Smart SOS Button - Bluetooth pendant with keychain and card"
                  className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl"
                  priority={true}
                  sizes={getImageSizes('hero')}
                  blurDataURL={generateBlurPlaceholder(400, 600)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Home Integration Section */}
      <section className="py-section bg-gradient-to-br from-primary/5 via-background to-guardian/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Smart Home Integration</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Seamlessly integrates with your existing smart home ecosystem. Professional-grade compatibility with zero additional hubs or complex setup required.
            </p>
          </div>

          {/* Integration Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 text-center hover-scale border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/80">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">A</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Amazon Alexa</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Voice-activated emergency system with household-wide alerts and instant response coordination.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Compatible with all Alexa devices</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Multi-room emergency broadcasting</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Voice command: "Alexa, help help help"</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Professional monitoring integration</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 text-center hover-scale border-guardian/20 hover:border-guardian/40 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/80">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-guardian/20 to-guardian/10 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 bg-guardian rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">G</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Google Home</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Advanced AI-powered emergency response with intelligent location sharing and contact prioritization.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Google Nest ecosystem support</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Intelligent emergency routing</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Voice command: "Hey Google, emergency"</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Real-time location broadcast</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 text-center hover-scale border-emergency/20 hover:border-emergency/40 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/80">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emergency/20 to-emergency/10 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 bg-emergency rounded-xl flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Universal Mobile</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Cross-platform compatibility with enterprise-grade security and 24/7 background protection monitoring.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>iOS & Android certified</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Bluetooth 5.0 Low Energy</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>Background service protection</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-wellness" />
                  <span>100m professional range</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Professional Setup Process */}
          <div className="bg-gradient-to-br from-card via-card/95 to-card/90 rounded-3xl p-10 shadow-2xl border border-primary/10">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold mb-4">Professional Installation Process</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enterprise-grade setup with professional support and comprehensive testing protocols
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center text-white font-bold mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-xl">1</span>
                  </div>
                  <div className="absolute -inset-2 bg-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </div>
                <h4 className="font-bold text-lg mb-2">Download & Setup</h4>
                <p className="text-sm text-muted-foreground">Professional app installation with guided configuration</p>
              </div>
              
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-guardian to-guardian-glow rounded-2xl flex items-center justify-center text-white font-bold mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-xl">2</span>
                  </div>
                  <div className="absolute -inset-2 bg-guardian/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </div>
                <h4 className="font-bold text-lg mb-2">Device Pairing</h4>
                <p className="text-sm text-muted-foreground">Secure Bluetooth 5.0 connection with encryption</p>
              </div>
              
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emergency to-emergency-glow rounded-2xl flex items-center justify-center text-white font-bold mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-xl">3</span>
                  </div>
                  <div className="absolute -inset-2 bg-emergency/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </div>
                <h4 className="font-bold text-lg mb-2">Smart Home Sync</h4>
                <p className="text-sm text-muted-foreground">Automated discovery and integration setup</p>
              </div>
              
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-wellness to-wellness-glow rounded-2xl flex items-center justify-center text-white font-bold mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-xl">4</span>
                  </div>
                  <div className="absolute -inset-2 bg-wellness/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </div>
                <h4 className="font-bold text-lg mb-2">System Testing</h4>
                <p className="text-sm text-muted-foreground">Comprehensive testing with professional verification</p>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="mt-12 grid md:grid-cols-2 gap-8">
              <div className="bg-background/50 rounded-2xl p-6 border border-primary/10">
                <h4 className="font-bold text-lg mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  Security & Compliance
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ End-to-end encryption</p>
                  <p>✓ GDPR compliant data handling</p>
                  <p>✓ ISO 27001 security standards</p>
                  <p>✓ Professional monitoring protocols</p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-2xl p-6 border border-guardian/10">
                <h4 className="font-bold text-lg mb-4 flex items-center">
                  <Zap className="h-5 w-5 text-guardian mr-2" />
                  Technical Specifications
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Bluetooth 5.0 Low Energy</p>
                  <p>✓ 100-meter professional range</p>
                  <p>✓ 7+ day battery life</p>
                  <p>✓ IP67 waterproof rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-section bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Emergency Protection Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade safety technology in a compact, wearable design
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover-scale border-primary/20 hover:border-primary/40 transition-colors">
                <feature.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                <p className="text-sm font-medium">{feature.text}</p>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl overflow-hidden shadow-lg hover-scale">
              <img
                src="/lovable-uploads/5c1a45e0-5a70-4691-bc64-550668fe6e0f.png"
                alt="LifeLink Sync Pendant on lanyard for comfortable daily wear"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="font-semibold mb-2">Comfortable Lanyard</h3>
                  <p className="text-sm opacity-90">Daily protection with adjustable lanyard</p>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-lg hover-scale">
              <img
                src="/lovable-uploads/51174548-f504-43a6-b947-a681fdfb6552.png"
                alt="LifeLink Sync Pendant with secure carabiner clip attachment"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="font-semibold mb-2">Secure Clip</h3>
                  <p className="text-sm opacity-90">Carabiner attachment for bags & belts</p>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-lg hover-scale">
              <img
                src="/lovable-uploads/a9a98b5b-436a-488c-b4f0-4a9c3ba75614.png"
                alt="LifeLink Sync Pendant with comfortable wristbands in white and black"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="font-semibold mb-2">Sport Wristbands</h3>
                  <p className="text-sm opacity-90">Active wear with white & black options</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing and Description Section */}
          <div className="mt-16 bg-gradient-to-br from-card via-card/95 to-card/90 rounded-3xl p-10 shadow-2xl border border-primary/10">
            <div className="text-center max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">Complete Protection Package</h3>
              
              <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
                <div className="text-left">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    The LifeLink Sync Bluetooth Pendant is a professional-grade emergency response device that provides instant protection with one-button activation. Featuring IP67 waterproof design, 7+ day battery life, and 100-meter Bluetooth range, this pendant ensures you're always connected to help when you need it most.
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Complete with three wearing options - comfortable lanyard, secure carabiner clip, and sport wristbands - this comprehensive safety solution integrates seamlessly with your smartphone and smart home devices for 24/7 peace of mind.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-primary mb-2">€59.99</div>
                    <div className="text-lg text-muted-foreground">+ €4.99 shipping</div>
                    <div className="text-sm text-muted-foreground mt-2">One-time purchase • No monthly fees</div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-wellness" />
                      <span className="text-sm">Complete package with all accessories</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-wellness" />
                      <span className="text-sm">2-year warranty included</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-wellness" />
                      <span className="text-sm">Free professional setup support</span>
                    </div>
                  </div>
                  
                  {comingSoon ? (
                    <Badge className="px-6 py-3 text-lg font-semibold bg-secondary text-white">Coming Soon</Badge>
                  ) : (
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-4 rounded-xl"
                    >
                      <Link to="/ai-register">Join Now - Get Protected Today</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Customer Stories Section */}
      <section className="py-section bg-gradient-to-br from-primary/10 via-background to-guardian/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Professional Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Real emergencies, real outcomes. Trusted by thousands of families worldwide for critical protection.
            </p>
          </div>

          {/* Enhanced Customer Stories Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="p-8 hover-scale border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/90 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-glow"></div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mr-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex text-amber-400 mb-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Medical Emergency</div>
                </div>
              </div>
              <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                "LifeLink Sync saved my father's life when he collapsed during his morning walk. Within seconds, all emergency contacts received his exact GPS location and medical profile. The ambulance arrived in under 8 minutes."
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-white font-bold mr-3">
                  M
                </div>
                <div>
                  <div className="font-semibold text-sm">Maria S.</div>
                  <div className="text-xs text-muted-foreground">Barcelona, Spain • Verified Customer</div>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover-scale border-guardian/20 hover:border-guardian/40 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/90 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-guardian to-guardian-glow"></div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-guardian/20 to-guardian/10 rounded-full flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-guardian" />
                </div>
                <div>
                  <div className="flex text-amber-400 mb-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Home Emergency</div>
                </div>
              </div>
              <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                "Living alone at 78, I had a severe reaction to medication. One button press instantly alerted my daughter and neighbors with my complete medical information and exact location. Professional response saved my life."
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-guardian to-guardian-glow rounded-full flex items-center justify-center text-white font-bold mr-3">
                  J
                </div>
                <div>
                  <div className="font-semibold text-sm">James K.</div>
                  <div className="text-xs text-muted-foreground">London, UK • Verified Customer</div>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover-scale border-emergency/20 hover:border-emergency/40 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-card/90 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emergency to-emergency-glow"></div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emergency/20 to-emergency/10 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-emergency" />
                </div>
                <div>
                  <div className="flex text-amber-400 mb-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Family Security</div>
                </div>
              </div>
              <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                "My mother accidentally pressed the pendant while gardening. Every family member received immediate alerts with her location. The system works flawlessly - exactly when we need it most. Peace of mind achieved."
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-emergency to-emergency-glow rounded-full flex items-center justify-center text-white font-bold mr-3">
                  A
                </div>
                <div>
                  <div className="font-semibold text-sm">Anna P.</div>
                  <div className="text-xs text-muted-foreground">Madrid, Spain • Verified Customer</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-8 bg-card/50 backdrop-blur-sm rounded-2xl px-8 py-4 border border-primary/10">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-wellness" />
                <span className="text-sm font-medium">ISO 27001 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-emergency" />
                <span className="text-sm font-medium">Medical Grade Security</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-section bg-gradient-to-br from-guardian/5 via-background to-wellness/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive answers to technical, operational, and business questions about your LifeLink Sync Bluetooth Pendant
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                How does the emergency system work?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                One button press instantly alerts ALL emergency contacts with your exact GPS location. The system uses Bluetooth 5.0 for secure smartphone connection and professional-grade emergency protocols with 24/7 monitoring capabilities.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                What's the battery life and charging process?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                7+ days typical use with intelligent power management. Magnetic USB charging takes 2 hours for full charge. Low battery alerts ensure you're never caught unprepared. Enterprise-grade lithium battery with 2-year warranty.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                Is the device waterproof for all activities?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                IP67 certified waterproof rating for swimming, showering, and extreme weather. Professional testing ensures reliability in all conditions. Saltwater resistant for beach activities with full functionality maintained underwater up to 1 meter.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                What wearing options are included?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                Complete package includes: adjustable lanyard for daily wear, secure carabiner clip for bags/belts, and comfortable sport wristbands (white & black). All attachments are professionally tested for security and comfort.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                Which smartphones and smart homes are compatible?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                Universal compatibility: iOS 12+ and Android 8+. Seamless integration with Amazon Alexa, Google Home, and all major smart home platforms. Professional setup ensures optimal performance across all systems.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                What's the range and connection reliability?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                100-meter professional range in open areas, 30-50m through walls. Advanced signal processing ensures reliable connection. Automatic reconnection when back in range with missed alert notifications for complete peace of mind.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                How much does the service cost?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                Device: €59.99 + €4.99 shipping. No monthly fees for basic emergency contacts. Optional professional monitoring services available. All major payment methods accepted with secure checkout and immediate activation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                What privacy and security measures are in place?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                End-to-end encryption for all data. GDPR compliant with zero data sharing. Your location and medical information are stored securely with military-grade encryption. Full control over who receives alerts and when.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                Is international travel supported?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                Global coverage with local emergency service integration in 50+ countries. Automatic regional compliance and language support. Professional partnerships ensure consistent service quality worldwide with local emergency protocols.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-black hover:no-underline hover:bg-muted/50 transition-colors">
                What warranty and support is provided?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed text-sm">
                2-year full warranty covering device, battery, and accessories. 24/7 technical support in 25+ languages. Free replacement for any manufacturing defects. Professional setup assistance and ongoing technical consultation included.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-section bg-gradient-to-br from-primary/10 to-emergency/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready for Complete Protection?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands who trust LifeLink Sync for emergency protection
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {comingSoon ? (
              <Badge className="px-6 py-3 text-lg font-semibold bg-secondary text-white">Coming Soon</Badge>
            ) : (
              <>
                <Button size="lg" className="px-8 py-3 font-semibold bg-emergency hover:bg-emergency/90" asChild>
                  <Link to="/ai-register">Order Now - €59.99 + €4.99 shipping</Link>
                </Button>
                <div className="text-sm text-muted-foreground">
                  <Check className="h-4 w-4 inline mr-1 text-green-600" />
                  30-day guarantee • 24/7 support
                </div>
              </>
            )}
          </div>
        </div>
      </section>


      </main>
      <Footer />
    </div>
  );
};

export default DeviceIceSosPendant;