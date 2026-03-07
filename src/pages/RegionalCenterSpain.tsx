import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, Shield, Users, CheckCircle2, Heart, AlertTriangle, Globe, HeadphonesIcon, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const RegionalCenterSpain: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Basic SEO: set page title programmatically
  useEffect(() => {
    const prev = document.title;
    document.title = `${t('regionalCenterES.h1')} | LifeLink Sync`;
    return () => { document.title = prev; };
  }, [t, i18n.language]);

  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LifeLink Sync – Spain Regional Call Centre',
    areaServed: 'ES',
    url: typeof window !== 'undefined' ? window.location.href : 'https://example.com/regional-center/spain',
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'emergency',
      availableLanguage: ['English', 'Spanish'],
      areaServed: 'ES'
    }]
  }), []);

  const whatWeDo: string[] = t('regionalCenterES.whatWeDo', { returnObjects: true }) as unknown as string[];
  const whenToContact: string[] = t('regionalCenterES.whenToContact', { returnObjects: true }) as unknown as string[];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16 md:pt-20">
        <SEO 
          title="Regional Call Centre Spain – LifeLink Sync" 
          description="Spain regional emergency support center. English & Spanish assistance for LifeLink Sync users." 
          structuredData={jsonLd} 
        />
        
        {/* Hero Section - Matching brand style */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-hero shadow-2xl mb-4">
          <div className="container mx-auto px-4 py-section relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="text-center lg:text-left text-white">
                <div className="inline-flex items-center space-x-2 bg-emergency/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg border border-emergency/30">
                  <MapPin className="h-4 w-4 text-emergency-glow" />
                  <span className="text-sm font-medium text-wellness">Regional Emergency Support - Spain</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
                  {t('regionalCenterES.h1', { defaultValue: 'Spain Regional Call Centre' })}
                  <span className="text-wellness drop-shadow-md"> - Emergency Support</span>
                </h1>
                
                <p className="text-xl md:text-2xl mb-8 text-white leading-relaxed font-medium drop-shadow-sm">
                  {t('regionalCenterES.heroDescription', { defaultValue: 'Bilingual English & Spanish 24/7 emergency support with live translation and coordination with local services.' })}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                  <Button 
                    asChild 
                    size="xl" 
                    className="bg-wellness text-white hover:bg-wellness/90 shadow-glow hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-wellness/20"
                  >
                    <Link to="/ai-register">Join Now</Link>
                  </Button>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="relative">
                <div className="relative z-10">
                  <img 
                    src="/lovable-uploads/ad6fb102-913b-42c4-a5e9-81162c5616c0.png" 
                    alt="Spain Regional Emergency Call Center Team - Professional bilingual support staff with headsets"
                    className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl"
                    loading="eager"
                    decoding="async"
                    sizes="(min-width: 1024px) 512px, 90vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bilingual Emergency Assistance Section */}
        <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emergency/5 pointer-events-none"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 bg-emergency/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg border border-emergency/30">
                  <Globe className="h-4 w-4 text-emergency" />
                  <span className="text-sm font-medium text-emergency">24/7 Available</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  24/7 Bilingual Emergency Assistance for Expats in Spain
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Living in Spain as an expat or visiting for travel can be challenging when an emergency arises. In urgent situations, clear communication is essential — but language barriers often add unnecessary stress. With LifeLink Sync, you are never alone. Our Spain Regional Emergency Support team provides professional, bilingual assistance to ensure that you receive help quickly, your needs are understood, and your family is kept informed every step of the way.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-wellness/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
                <Card className="relative z-10 p-8 border-2 border-wellness/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="text-center">
                    <Heart className="h-16 w-16 text-wellness mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Never Alone</h3>
                    <p className="text-muted-foreground">Professional support when you need it most</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Bilingual Support Section */}
        <section className="py-20 bg-gradient-to-r from-primary/5 to-guardian/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105">
                    <Clock className="h-12 w-12 text-primary mb-4" />
                    <h4 className="font-semibold text-lg mb-2">24/7 Available</h4>
                    <p className="text-sm text-muted-foreground">Round-the-clock emergency response</p>
                  </Card>
                  <Card className="p-6 border-2 border-wellness/20 hover:border-wellness/40 transition-all duration-300 hover:scale-105">
                    <HeadphonesIcon className="h-12 w-12 text-wellness mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Live Translation</h4>
                    <p className="text-sm text-muted-foreground">Real-time English-Spanish support</p>
                  </Card>
                  <Card className="p-6 border-2 border-guardian/20 hover:border-guardian/40 transition-all duration-300 hover:scale-105">
                    <MapPin className="h-12 w-12 text-guardian mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Local Knowledge</h4>
                    <p className="text-sm text-muted-foreground">Cultural understanding & expertise</p>
                  </Card>
                  <Card className="p-6 border-2 border-emergency/20 hover:border-emergency/40 transition-all duration-300 hover:scale-105">
                    <Zap className="h-12 w-12 text-emergency mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Direct Coordination</h4>
                    <p className="text-sm text-muted-foreground">First responder communication</p>
                  </Card>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Professional Bilingual Support
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  At our Spain-based emergency call center, trained agents fluent in both English and Spanish are available around the clock. Whether you prefer to explain your situation in English or Spanish, our staff will handle the conversation with local emergency services, provide live translation during calls, and coordinate directly with first responders. With local knowledge and cultural understanding, our team ensures that nothing is lost in translation during a crisis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How We Help Section */}
        <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How We Help You
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                From the very first call, our focus is on providing calm, professional guidance through every step of your emergency.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <Card className="pt-8 pb-6 px-6 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105">
                  <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-center">Emergency Triage</h3>
                  <p className="text-muted-foreground text-center">We handle emergency triage and quickly assess the situation before connecting with the right services.</p>
                </Card>
              </div>

              <div className="relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 bg-wellness rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <Card className="pt-8 pb-6 px-6 border-2 border-wellness/20 hover:border-wellness/40 transition-all duration-300 hover:scale-105">
                  <HeadphonesIcon className="h-12 w-12 text-wellness mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-center">Live Translation</h3>
                  <p className="text-muted-foreground text-center">If you cannot communicate effectively with doctors, hospitals, or emergency responders, we step in as your voice.</p>
                </Card>
              </div>

              <div className="relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 bg-guardian rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <Card className="pt-8 pb-6 px-6 border-2 border-guardian/20 hover:border-guardian/40 transition-all duration-300 hover:scale-105">
                  <Users className="h-12 w-12 text-guardian mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-center">Family Updates</h3>
                  <p className="text-muted-foreground text-center">We ensure your designated family members or caregivers are updated, offering reassurance and clarity when they need it most.</p>
                </Card>
              </div>
            </div>

            <div className="text-center mt-12">
              <Card className="inline-block p-6 border-2 border-emergency/20 bg-gradient-to-r from-emergency/5 to-primary/5">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-8 w-8 text-emergency" />
                  <div className="text-left">
                    <h4 className="font-semibold text-lg">Continuous Support</h4>
                    <p className="text-muted-foreground">Our support does not stop when the call ends — we continue to follow up and liaise until the case is fully resolved.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* When You Might Need Us Section */}
        <section className="py-20 bg-gradient-to-r from-warning/5 to-emergency/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                When You Might Need Us
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our service is designed for expats and travelers who prefer to speak English but find themselves in urgent situations in Spain.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 border-2 border-emergency/20 hover:border-emergency/40 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <AlertTriangle className="h-12 w-12 text-emergency mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-center">Medical Emergency</h3>
                <p className="text-muted-foreground text-center text-sm">When you're experiencing a medical emergency and need immediate professional assistance.</p>
              </Card>

              <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-center">Police Assistance</h3>
                <p className="text-muted-foreground text-center text-sm">When you require police assistance or guidance during a stressful event.</p>
              </Card>

              <Card className="p-6 border-2 border-wellness/20 hover:border-wellness/40 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Users className="h-12 w-12 text-wellness mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-center">Family Notification</h3>
                <p className="text-muted-foreground text-center text-sm">When you want your family notified and reassured while you are receiving care.</p>
              </Card>

              <Card className="p-6 border-2 border-guardian/20 hover:border-guardian/40 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Phone className="h-12 w-12 text-guardian mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-center">Device Issues</h3>
                <p className="text-muted-foreground text-center text-sm">Even device or subscription issues that could affect your safety can be escalated to our team.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Complete Coverage Section */}
        <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-wellness/5 via-transparent to-primary/5 pointer-events-none"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Complete Coverage
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The Spain Regional Emergency Support service is available 24 hours a day, every day of the year.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-center">
              <div className="space-y-6">
                <Card className="p-6 border-2 border-wellness/20">
                  <Clock className="h-8 w-8 text-wellness mb-3" />
                  <h3 className="font-semibold text-lg mb-2">24/7 Availability</h3>
                  <p className="text-muted-foreground">Available 24 hours a day, every day of the year</p>
                </Card>
                <Card className="p-6 border-2 border-primary/20">
                  <Shield className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Strict Confidentiality</h3>
                  <p className="text-muted-foreground">Calls handled in strict confidence with secure recordings</p>
                </Card>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-wellness/20 rounded-full blur-3xl"></div>
                <Card className="relative z-10 p-8 text-center border-2 border-primary/30 shadow-2xl">
                  <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Entire Spanish Territory</h3>
                  <p className="text-muted-foreground mb-6">Complete coverage across all regions of Spain</p>
                  <div className="flex justify-center space-x-4">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">English</Badge>
                    <Badge variant="secondary" className="bg-emergency/20 text-emergency">Español</Badge>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border-2 border-emergency/20">
                  <Globe className="h-8 w-8 text-emergency mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Bilingual Service</h3>
                  <p className="text-muted-foreground">Available in both English and Spanish languages</p>
                </Card>
                <Card className="p-6 border-2 border-guardian/20">
                  <CheckCircle2 className="h-8 w-8 text-guardian mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Wherever You Are</h3>
                  <p className="text-muted-foreground">Confident that help is just a call away</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Peace of Mind Section */}
        <section className="py-20 bg-gradient-to-r from-wellness/10 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                Peace of Mind for Expats in Spain
              </h2>
              <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
                Emergencies are stressful enough without the added challenge of a language barrier. By joining LifeLink Sync, you gain access to a dedicated team that understands both the Spanish emergency system and the needs of international residents. We provide more than just translation — we ensure coordination, clarity, and care for both you and your family, giving you complete peace of mind while living or traveling in Spain.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <Card className="p-6 border-2 border-wellness/20 hover:border-wellness/40 transition-all duration-300">
                  <Heart className="h-12 w-12 text-wellness mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-3">More Than Translation</h3>
                  <p className="text-muted-foreground text-sm">Complete coordination and care for you and your family</p>
                </Card>

                <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-3">System Understanding</h3>
                  <p className="text-muted-foreground text-sm">Deep knowledge of Spanish emergency systems and procedures</p>
                </Card>

                <Card className="p-6 border-2 border-guardian/20 hover:border-guardian/40 transition-all duration-300">
                  <CheckCircle2 className="h-12 w-12 text-guardian mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-3">Complete Peace of Mind</h3>
                  <p className="text-muted-foreground text-sm">Confidence and security while living or traveling in Spain</p>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-primary/20 to-wellness/20 rounded-2xl p-8 border-2 border-primary/30">
                <h3 className="text-2xl font-bold mb-4">Ready to Join LifeLink Sync?</h3>
                <p className="text-lg text-muted-foreground mb-8">Get professional bilingual emergency support specifically designed for expats in Spain.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="xl" className="bg-primary hover:bg-primary/90 text-white">
                    <Link to="/ai-register">Join Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="xl">
                    <Link to="/support">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegionalCenterSpain;
