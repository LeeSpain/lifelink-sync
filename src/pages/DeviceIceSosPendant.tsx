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
import { usePricing } from "@/hooks/usePricing";

const DeviceIceSosPendant = () => {
  const { t } = useTranslation();
  const { openClaraChat } = useClaraChat();
  const { prices, formatPrice } = usePricing();
  const [comingSoon] = useState(true); // Pre-launch: pendant not yet available
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
      price: String((prices.pendant_price + 4.99).toFixed(2)),
      availability: "https://schema.org/PreOrder",
      url: canonical,
      description: `LifeLink Sync Bluetooth Pendant ${formatPrice(prices.pendant_price)} + €4.99 shipping`
    }
  };

  // DB status check removed — hardcoded to Coming Soon for pre-launch

  const features = [
    { icon: Bluetooth, title: t('devicePendant.feature1Title'), description: t('devicePendant.feature1Desc') },
    { icon: Droplets, title: t('devicePendant.feature2Title'), description: t('devicePendant.feature2Desc') },
    { icon: Battery, title: t('devicePendant.feature3Title'), description: t('devicePendant.feature3Desc') },
    { icon: MapPin, title: t('devicePendant.feature4Title'), description: t('devicePendant.feature4Desc') },
  ];

  const steps = [
    { num: "1", title: t('devicePendant.step1Title'), desc: t('devicePendant.step1Desc') },
    { num: "2", title: t('devicePendant.step2Title'), desc: t('devicePendant.step2Desc') },
    { num: "3", title: t('devicePendant.step3Title'), desc: t('devicePendant.step3Desc') },
    { num: "4", title: t('devicePendant.step4Title'), desc: t('devicePendant.step4Desc') },
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
        <section className="relative min-h-[60vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#FAFAF9]">
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
                  <span className="text-sm font-medium text-primary">{t('devicePendant.optionalAddon', 'Optional Add-On Device')}</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 leading-tight text-[hsl(215,25%,27%)]">
                  {t('devicePendant.pageTitle')}
                </h1>

                <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed font-inter">
                  {t('devicePendant.heroDescription')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  {comingSoon ? (
                    <Badge className="px-6 py-3 text-lg font-semibold bg-secondary text-white">{t('devicePendant.comingSoon', 'Coming Soon')}</Badge>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
                    >
                      <Link to="/onboarding">
                        <Shield className="h-5 w-5 mr-2" />
                        {t('devicePendant.getProtected', 'Get Protected')}
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
                    {t('devicePendant.askClara', 'Ask Clara')}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-wellness" />
                    <span>{t('devicePendant.noMonthlyFees')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-wellness" />
                    <span>{t('devicePendant.twoYearWarranty')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-wellness" />
                    <span>{t('devicePendant.freeSetupSupport')}</span>
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
                {t('devicePendant.builtForProtection', 'Built for Real Protection')}
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                {t('devicePendant.builtForProtectionDesc', 'Professional-grade safety technology in a compact, wearable design')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                {t('devicePendant.wearYourWay')}
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                {t('devicePendant.wearDescription')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { src: "/lovable-uploads/lifelink-pendant-hero.png", alt: "Pendant with comfortable lanyard", title: t('devicePendant.lanyardTitle'), desc: t('devicePendant.lanyardDesc') },
                { src: "/lovable-uploads/51174548-f504-43a6-b947-a681fdfb6552.png", alt: "Pendant with secure carabiner clip", title: t('devicePendant.clipTitle'), desc: t('devicePendant.clipDesc') },
                { src: "/lovable-uploads/a9a98b5b-436a-488c-b4f0-4a9c3ba75614.png", alt: "Pendant with sport wristbands", title: t('devicePendant.wristbandTitle'), desc: t('devicePendant.wristbandDesc') },
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
                {t('devicePendant.connectsToDevices')}
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-3xl mx-auto">
                {t('devicePendant.connectsDesc')}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  letter: "A", label: t('devicePendant.alexaTitle'),
                  iconBg: "bg-primary/10", iconText: "text-primary",
                  desc: t('devicePendant.alexaDesc'),
                  items: [t('devicePendant.alexaItem1', 'All Alexa devices'), t('devicePendant.alexaItem2', 'Multi-room alerts'), t('devicePendant.alexaItem3', '"Alexa, help help help"'), t('devicePendant.alexaItem4', 'Account linking')],
                  comingSoon: true
                },
                {
                  letter: "G", label: t('devicePendant.googleTitle'),
                  iconBg: "bg-guardian/10", iconText: "text-guardian",
                  desc: t('devicePendant.googleDesc'),
                  items: [t('devicePendant.googleItem1', 'Google Nest support'), t('devicePendant.googleItem2', 'Intelligent routing'), t('devicePendant.googleItem3', '"Hey Google, emergency"'), t('devicePendant.googleItem4', 'Real-time location')],
                  comingSoon: true
                },
                {
                  icon: Smartphone, label: t('devicePendant.mobileTitle'),
                  iconBg: "bg-primary/10", iconText: "text-primary",
                  desc: t('devicePendant.mobileDesc'),
                  items: [t('devicePendant.mobileItem1', 'iOS & Android'), t('devicePendant.mobileItem2', 'Bluetooth 5.0 LE'), t('devicePendant.mobileItem3', 'Active while app is open'), t('devicePendant.mobileItem4', '100m range')],
                  comingSoon: false
                },
              ].map((card, i) => (
                <Card key={i} className={`bg-white border-[#E5E7EB] rounded-2xl hover:shadow-lg transition-shadow duration-300 p-8 text-center ${card.comingSoon ? 'opacity-80' : ''}`}>
                  {card.comingSoon && (
                    <Badge className="mb-4 bg-secondary text-white">{t('devicePendant.comingSoon', 'Coming Soon')}</Badge>
                  )}
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
                {t('devicePendant.setupInMinutes', 'Setup in Minutes')}
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                {t('devicePendant.setupDesc', 'Professional-grade protection with a simple setup process')}
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
                  <h2 className="text-2xl font-bold font-poppins text-[hsl(215,25%,27%)] mb-1">{t('devicePendant.completePackage')}</h2>
                  <p className="text-gray-500 font-inter text-sm">{t('devicePendant.everythingIncluded')}</p>
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold font-poppins text-primary mb-1">{formatPrice(prices.pendant_price)}</div>
                    <div className="text-gray-500 font-inter">{t('devicePendant.shippingCost')}</div>
                    <div className="text-xs text-gray-400 mt-1">{t('devicePendant.oneTimePurchase')}</div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      t('devicePendant.packageFeature1'),
                      t('devicePendant.packageFeature2'),
                      t('devicePendant.packageFeature3'),
                      t('devicePendant.packageFeature4'),
                      t('devicePendant.packageFeature5'),
                      t('devicePendant.packageFeature6'),
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-wellness flex-shrink-0" />
                        <span className="text-sm text-gray-600 font-inter">{item}</span>
                      </div>
                    ))}
                  </div>

                  {comingSoon ? (
                    <Badge className="w-full justify-center px-6 py-3 text-lg font-semibold bg-secondary text-white">{t('devicePendant.comingSoon', 'Coming Soon')}</Badge>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg py-6 rounded-xl"
                    >
                      <Link to="/onboarding">{t('devicePendant.getProtectedToday', 'Get Protected Today')}</Link>
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
                  {t('devicePendant.claraQuestion', 'Have questions about the pendant?')}
                </h2>
                <p className="text-gray-600 font-inter mb-5">
                  {t('devicePendant.claraDescription', 'Clara, our AI assistant, knows everything about the LifeLink Sync Bluetooth Pendant. Ask about features, compatibility, setup, or anything else.')}
                </p>
                <Button
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
                  onClick={openClaraChat}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {t('devicePendant.chatWithClara', 'Chat with Clara')}
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
                {t('devicePendant.testimonialsTitle')}
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                {t('devicePendant.testimonialsSubtitle', 'Hear from families who trust LifeLink Sync every day')}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart, iconBg: "bg-primary/10", iconText: "text-primary", category: t('devicePendant.testimonial1Category'), initial: "M", name: t('devicePendant.testimonial1Name'), location: t('devicePendant.testimonial1Location'),
                  quote: t('devicePendant.testimonial1Quote')
                },
                {
                  icon: Shield, iconBg: "bg-guardian/10", iconText: "text-guardian", category: t('devicePendant.testimonial2Category'), initial: "J", name: t('devicePendant.testimonial2Name'), location: t('devicePendant.testimonial2Location'),
                  quote: t('devicePendant.testimonial2Quote')
                },
                {
                  icon: Users, iconBg: "bg-primary/10", iconText: "text-primary", category: t('devicePendant.testimonial3Category'), initial: "A", name: t('devicePendant.testimonial3Name'), location: t('devicePendant.testimonial3Location'),
                  quote: t('devicePendant.testimonial3Quote')
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
                {t('devicePendant.faqTitle')}
              </h2>
              <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
                {t('devicePendant.faqSubtitle', 'Everything you need to know about the LifeLink Sync Bluetooth Pendant')}
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {[
                { q: t('devicePendant.faq1Q'), a: t('devicePendant.faq1A') },
                { q: t('devicePendant.faq2Q'), a: t('devicePendant.faq2A') },
                { q: t('devicePendant.faq3Q'), a: t('devicePendant.faq3A') },
                { q: t('devicePendant.faq4Q'), a: t('devicePendant.faq4A') },
                { q: t('devicePendant.faq5Q'), a: t('devicePendant.faq5A') },
                { q: t('devicePendant.faq6Q', "What's the range and connection reliability?"), a: t('devicePendant.faq6A', "The pendant connects via Bluetooth to your phone, which must have the LifeLink app installed. Typical range is 10-30 metres depending on environment. Automatic reconnection when back in range with missed alert notifications.") },
                { q: t('devicePendant.faq7Q', 'How much does the pendant cost?'), a: t('devicePendant.faq7A', { defaultValue: `Device: ${formatPrice(prices.pendant_price)} + €4.99 shipping. No monthly fees for basic emergency contacts. Optional professional monitoring services available.` }) },
                { q: t('devicePendant.faq8Q', 'What privacy and security measures are in place?'), a: t('devicePendant.faq8A', 'End-to-end encryption for all data. GDPR compliant with zero data sharing. Full control over who receives alerts and when.') },
                { q: t('devicePendant.faq9Q', 'Is international travel supported?'), a: t('devicePendant.faq9A', 'Global coverage with local emergency service integration in 50+ countries. Automatic regional compliance and language support.') },
                { q: t('devicePendant.faq10Q', 'What warranty and support is provided?'), a: t('devicePendant.faq10A', '2-year full warranty covering device, battery, and accessories. 24/7 technical support. Free replacement for manufacturing defects.') },
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
                {t('devicePendant.readyForProtection')}
              </h2>
              <p className="text-lg text-white/90 mb-10 font-inter leading-relaxed">
                {t('devicePendant.readyDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {comingSoon ? (
                  <Badge className="px-6 py-3 text-lg font-semibold bg-white/20 text-white border border-white/30">{t('devicePendant.comingSoon', 'Coming Soon')}</Badge>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Link to="/onboarding">
                        <Shield className="h-5 w-5 mr-2" />
                        {t('devicePendant.orderNow')} — {formatPrice(prices.pendant_price)}
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 py-6 rounded-xl transition-all duration-300"
                      onClick={openClaraChat}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {t('devicePendant.askClara', 'Ask Clara')}
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
