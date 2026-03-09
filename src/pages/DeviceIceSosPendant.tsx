import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, Bluetooth, Battery, Droplets, MapPin, Shield, CheckCircle2, Smartphone, Heart, Star, Users, MessageCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/ui/optimized-image";
import { getImageSizes, generateBlurPlaceholder } from "@/utils/imageOptimization";
import { useClaraChat } from "@/contexts/ClaraChatContext";

const DeviceIceSosPendant = () => {
  const { t } = useTranslation();
  const { openClaraChat } = useClaraChat();
  const [comingSoon, setComingSoon] = useState(false);
  const title = t('devices.icePendant.seoTitle', { defaultValue: 'LifeLink Sync Bluetooth Pendant – LifeLink Sync' });
  const description = t('devices.icePendant.metaDescription', { defaultValue: 'Hands-free emergency pendant with Bluetooth, waterproof design, and 7-day battery. Works with LifeLink Sync app.' });
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/devices/lifelink-sync-pendant` : "https://example.com/devices/lifelink-sync-pendant";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "LifeLink Sync Bluetooth Pendant",
    brand: { "@type": "Brand", name: "LifeLink Sync" },
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
    const fetchStatus = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('status')
          .eq('name', 'LifeLink Sync Bluetooth Pendant')
          .maybeSingle();
        if (data?.status === 'coming_soon') setComingSoon(true);
      } catch (error) {
        // Silently fail - default to available
      }
    };
    fetchStatus();
  }, []);

  const features = [
    { icon: Bluetooth, title: "Bluetooth 5.0", description: "Low energy instant pairing with your smartphone" },
    { icon: Droplets, title: "IP67 Waterproof", description: "Shower, swim, and wear in any weather" },
    { icon: Battery, title: "7+ Day Battery", description: "Long-lasting with magnetic USB charging" },
    { icon: MapPin, title: "100m Range", description: "Professional Bluetooth range from your phone" },
  ];

  const steps = [
    { num: "1", title: "Download App", desc: "Install LifeLink Sync on iOS or Android" },
    { num: "2", title: "Pair Device", desc: "Secure Bluetooth 5.0 encrypted connection" },
    { num: "3", title: "Connect Home", desc: "Link Alexa, Google Home, or smart devices" },
    { num: "4", title: "You're Protected", desc: "One button press alerts all your contacts" },
  ];

  return (
    <div className="min-h-screen bg-white">
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

        {/* ============================================================ */}
        {/* 1. Hero */}
        {/* ============================================================ */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#FAFAF9]">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(#DC2626 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          <div className="absolute top-20 right-0 w-72 h-72 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 lg:w-80 lg:h-80 bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Optional Add-On Device</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 leading-tight text-[hsl(215,25%,27%)]">
                  LifeLink Sync{' '}
                  <span className="text-primary">Bluetooth Pendant</span>
                </h1>

                <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed font-inter">
                  Hands-free emergency protection. One button press alerts all your emergency contacts instantly with your exact location.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  {comingSoon ? (
                    <Badge className="px-6 py-3 text-lg font-semibold bg-secondary text-white">Coming Soon</Badge>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
                    >
                      <Link to="/register">
                        <Shield className="h-5 w-5 mr-2" />
                        Get Protected
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 font-semibold text-lg px-8 py-6 rounded-xl transition-all duration-300"
                    onClick={openClaraChat}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Ask Clara
                  </Button>
                </div>

                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-wellness" />
                    <span>No monthly fees</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-wellness" />
                    <span>2-year warranty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-wellness" />
                    <span>Free setup support</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative z-10">
                  <OptimizedImage
                    src="/lovable-uploads/lifelink-pendant-product.png"
                    alt="LifeLink Sync Smart SOS Button with accessories"
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

        {/* ============================================================ */}
        {/* 2. Key Features */}
        {/* ============================================================ */}
        <section className="py-section bg-[#F3F4F6]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
                Built for <span className="text-primary">Real Protection</span>
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                Professional-grade safety technology in a compact, wearable design
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <Card key={i} className="bg-white border-[#E5E7EB] rounded-2xl hover:shadow-lg transition-shadow duration-300 text-center p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold font-poppins text-lg mb-2 text-[hsl(215,25%,27%)]">{feature.title}</h3>
                  <p className="text-sm text-gray-500 font-inter">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. Product Gallery — Wearing Options */}
        {/* ============================================================ */}
        <section className="py-section bg-[#FAFAF9]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
                Three Ways to <span className="text-primary">Wear It</span>
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                Every pendant comes with a complete accessory kit for any lifestyle
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { src: "/lovable-uploads/lifelink-pendant-hero.png", alt: "Pendant with comfortable lanyard", title: "Comfortable Lanyard", desc: "Adjustable lanyard for daily wear" },
                { src: "/lovable-uploads/51174548-f504-43a6-b947-a681fdfb6552.png", alt: "Pendant with secure carabiner clip", title: "Secure Clip", desc: "Carabiner attachment for bags & belts" },
                { src: "/lovable-uploads/a9a98b5b-436a-488c-b4f0-4a9c3ba75614.png", alt: "Pendant with sport wristbands", title: "Sport Wristbands", desc: "Active wear in white & black options" },
              ].map((item, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                  <OptimizedImage
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes={getImageSizes('card')}
                    blurDataURL={generateBlurPlaceholder(400, 300)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="font-bold font-poppins text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-white/80 font-inter">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. Smart Home Integration */}
        {/* ============================================================ */}
        <section className="py-section bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
                Works With Your <span className="text-primary">Smart Home</span>
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-3xl mx-auto">
                Seamless integration with your favourite voice assistants and smart home platforms
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  letter: "A", label: "Amazon Alexa",
                  iconBg: "bg-primary/10", iconText: "text-primary",
                  desc: "Voice-activated emergency alerts across all Alexa devices in your home.",
                  items: ["All Alexa devices", "Multi-room alerts", '"Alexa, help help help"', "Professional monitoring"]
                },
                {
                  letter: "G", label: "Google Home",
                  iconBg: "bg-guardian/10", iconText: "text-guardian",
                  desc: "AI-powered emergency response with intelligent location sharing.",
                  items: ["Google Nest support", "Intelligent routing", '"Hey Google, emergency"', "Real-time location"]
                },
                {
                  icon: Smartphone, label: "Universal Mobile",
                  iconBg: "bg-primary/10", iconText: "text-primary",
                  desc: "Cross-platform compatibility with enterprise-grade security.",
                  items: ["iOS & Android", "Bluetooth 5.0 LE", "Background protection", "100m range"]
                },
              ].map((card, i) => (
                <Card key={i} className="bg-white border-[#E5E7EB] rounded-2xl hover:shadow-lg transition-shadow duration-300 p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${card.iconBg}`}>
                    {card.icon ? (
                      <card.icon className={`h-8 w-8 ${card.iconText}`} />
                    ) : (
                      <span className={`text-2xl font-bold ${card.iconText}`}>{card.letter}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-poppins mb-3 text-[hsl(215,25%,27%)]">{card.label}</h3>
                  <p className="text-gray-500 font-inter mb-6 text-sm">{card.desc}</p>
                  <div className="space-y-2.5 text-sm">
                    {card.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-wellness flex-shrink-0" />
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. How It Works */}
        {/* ============================================================ */}
        <section className="py-section bg-[#FAFAF9]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
                Setup in <span className="text-primary">Minutes</span>
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                Professional-grade protection with a simple setup process
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold font-poppins shadow-lg">
                    {step.num}
                  </div>
                  <h3 className="font-bold font-poppins text-lg mb-2 text-[hsl(215,25%,27%)]">{step.title}</h3>
                  <p className="text-sm text-gray-500 font-inter">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. Pricing Card */}
        {/* ============================================================ */}
        <section className="py-section bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <Card className="bg-white border-[#E5E7EB] rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="bg-primary/5 px-8 pt-8 pb-6 text-center">
                  <h2 className="text-2xl font-bold font-poppins text-[hsl(215,25%,27%)] mb-1">Complete Protection Package</h2>
                  <p className="text-gray-500 font-inter text-sm">Everything included — no hidden costs</p>
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold font-poppins text-primary mb-1">€59.99</div>
                    <div className="text-gray-500 font-inter">+ €4.99 shipping</div>
                    <div className="text-xs text-gray-400 mt-1">One-time purchase</div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      "Pendant device with all accessories",
                      "Lanyard, clip & wristbands included",
                      "2-year warranty",
                      "Free professional setup support",
                      "24/7 technical support",
                      "Works with iOS & Android",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-wellness flex-shrink-0" />
                        <span className="text-sm text-gray-600 font-inter">{item}</span>
                      </div>
                    ))}
                  </div>

                  {comingSoon ? (
                    <Badge className="w-full justify-center px-6 py-3 text-lg font-semibold bg-secondary text-white">Coming Soon</Badge>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg py-6 rounded-xl"
                    >
                      <Link to="/register">Get Protected Today</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. Clara CTA */}
        {/* ============================================================ */}
        <section className="py-section bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src="/clara-avatar.png"
                    alt="Clara AI Assistant"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20 shadow-lg"
                  />
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold font-poppins mb-3 text-[hsl(215,25%,27%)]">
                  Have questions about the pendant?
                </h2>
                <p className="text-gray-600 font-inter mb-5">
                  Clara, our AI assistant, knows everything about the LifeLink Sync Bluetooth Pendant. Ask about features, compatibility, setup, or anything else.
                </p>
                <Button
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
                  onClick={openClaraChat}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat with Clara
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. Testimonials */}
        {/* ============================================================ */}
        <section className="py-section bg-[#F3F4F6]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
                Real Stories, <span className="text-primary">Real Protection</span>
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                Hear from families who trust LifeLink Sync every day
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart, iconBg: "bg-primary/10", iconText: "text-primary", category: "Medical Emergency", initial: "M", name: "Maria S.", location: "Barcelona, Spain",
                  quote: "LifeLink Sync saved my father's life when he collapsed during his morning walk. Within seconds, all emergency contacts received his exact GPS location and medical profile. The ambulance arrived in under 8 minutes."
                },
                {
                  icon: Shield, iconBg: "bg-guardian/10", iconText: "text-guardian", category: "Home Emergency", initial: "J", name: "James K.", location: "London, UK",
                  quote: "Living alone at 78, I had a severe reaction to medication. One button press instantly alerted my daughter and neighbors with my complete medical information and exact location. Professional response saved my life."
                },
                {
                  icon: Users, iconBg: "bg-primary/10", iconText: "text-primary", category: "Family Security", initial: "A", name: "Anna P.", location: "Madrid, Spain",
                  quote: "My mother accidentally pressed the pendant while gardening. Every family member received immediate alerts with her location. The system works flawlessly — exactly when we need it most. Peace of mind achieved."
                },
              ].map((story, i) => (
                <Card key={i} className="bg-white border-[#E5E7EB] rounded-2xl hover:shadow-lg transition-shadow duration-300 p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${story.iconBg}`}>
                      <story.icon className={`h-5 w-5 ${story.iconText}`} />
                    </div>
                    <div>
                      <div className="flex text-amber-400 mb-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">{story.category}</div>
                    </div>
                  </div>

                  <blockquote className="text-gray-500 font-inter text-sm leading-relaxed italic mb-6">
                    "{story.quote}"
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {story.initial}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[hsl(215,25%,27%)]">{story.name}</div>
                      <div className="text-xs text-gray-400">{story.location}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. FAQ */}
        {/* ============================================================ */}
        <section className="py-section bg-[#FAFAF9]">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-4 text-[hsl(215,25%,27%)]">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                Everything you need to know about the LifeLink Sync Bluetooth Pendant
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {[
                { q: "How does the emergency system work?", a: "One button press instantly alerts ALL emergency contacts with your exact GPS location. The system uses Bluetooth 5.0 for secure smartphone connection and professional-grade emergency protocols with 24/7 monitoring capabilities." },
                { q: "What's the battery life and charging process?", a: "7+ days typical use with intelligent power management. Magnetic USB charging takes 2 hours for full charge. Low battery alerts ensure you're never caught unprepared." },
                { q: "Is the device waterproof for all activities?", a: "IP67 certified waterproof rating for swimming, showering, and extreme weather. Saltwater resistant for beach activities with full functionality maintained underwater up to 1 metre." },
                { q: "What wearing options are included?", a: "Complete package includes: adjustable lanyard for daily wear, secure carabiner clip for bags & belts, and comfortable sport wristbands in white and black. All attachments are tested for security and comfort." },
                { q: "Which smartphones and smart homes are compatible?", a: "Universal compatibility: iOS 12+ and Android 8+. Seamless integration with Amazon Alexa, Google Home, and all major smart home platforms." },
                { q: "What's the range and connection reliability?", a: "100-metre professional range in open areas, 30–50m through walls. Automatic reconnection when back in range with missed alert notifications." },
                { q: "How much does the pendant cost?", a: "Device: €59.99 + €4.99 shipping. No monthly fees for basic emergency contacts. Optional professional monitoring services available." },
                { q: "What privacy and security measures are in place?", a: "End-to-end encryption for all data. GDPR compliant with zero data sharing. Full control over who receives alerts and when." },
                { q: "Is international travel supported?", a: "Global coverage with local emergency service integration in 50+ countries. Automatic regional compliance and language support." },
                { q: "What warranty and support is provided?", a: "2-year full warranty covering device, battery, and accessories. 24/7 technical support. Free replacement for manufacturing defects." },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 text-left font-medium text-sm text-[hsl(215,25%,27%)] hover:no-underline hover:bg-gray-50 transition-colors font-inter">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-500 leading-relaxed text-sm font-inter">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 10. Final CTA */}
        {/* ============================================================ */}
        <section className="py-20 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF4444]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold font-poppins mb-6 text-white">
                Ready for Complete Protection?
              </h2>
              <p className="text-lg text-white/90 mb-10 font-inter leading-relaxed">
                Join thousands who trust LifeLink Sync for emergency protection. One device, total peace of mind.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {comingSoon ? (
                  <Badge className="px-6 py-3 text-lg font-semibold bg-white/20 text-white border border-white/30">Coming Soon</Badge>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Link to="/register">
                        <Shield className="h-5 w-5 mr-2" />
                        Order Now — €59.99
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 py-6 rounded-xl transition-all duration-300"
                      onClick={openClaraChat}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Ask Clara
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DeviceIceSosPendant;
