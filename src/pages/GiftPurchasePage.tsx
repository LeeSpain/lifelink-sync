import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Shield, Heart, Clock, Package, Loader2, Check, CreditCard, Mail, Star, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePricing } from '@/hooks/usePricing';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

type GiftType = 'monthly' | 'annual' | 'bundle' | 'voucher';

interface GiftPackage {
  type: GiftType;
  months: number;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  includesPendant?: boolean;
  title: string;
  desc: string;
  saving?: string;
  tag?: string;
  features: string[];
}

const GiftPurchasePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { prices, formatPrice } = usePricing();

  const [selectedType, setSelectedType] = useState<GiftType | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (user?.email) setPurchaserEmail(user.email);
    if (user) {
      supabase.from('profiles').select('first_name, last_name').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.first_name) setPurchaserName(`${data.first_name}${data.last_name ? ' ' + data.last_name : ''}`);
        });
    }
  }, [user]);

  const GIFT_PRICES: Record<GiftType, number> = {
    monthly: prices.individual_monthly,
    annual: prices.individual_annual,
    bundle: 149.00,
    voucher: prices.individual_annual,
  };

  const packages: GiftPackage[] = [
    {
      type: 'monthly', months: 1,
      icon: <Clock className="h-6 w-6" />,
      title: t('gift.monthly', { defaultValue: '1 Month' }),
      desc: t('gift.monthlyDesc', { defaultValue: 'A full month of CLARA AI protection. Perfect for trying it out together.' }),
      features: [
        t('gift.monthlyF1', { defaultValue: 'Full CLARA AI protection' }),
        t('gift.monthlyF2', { defaultValue: 'All SOS features included' }),
        t('gift.monthlyF3', { defaultValue: 'Set up in 2 minutes' }),
      ],
    },
    {
      type: 'annual', months: 12,
      badge: t('gift.mostPopular', { defaultValue: 'Most Popular' }), badgeColor: 'bg-red-500',
      icon: <Shield className="h-6 w-6" />,
      title: t('gift.annual', { defaultValue: '12 Months' }),
      desc: t('gift.annualDesc', { defaultValue: 'A full year of protection. The most thoughtful gift you can give.' }),
      saving: t('gift.annualSaving', { defaultValue: 'Save €19.98 vs monthly' }),
      features: [
        t('gift.annualF1', { defaultValue: 'Everything in monthly' }),
        t('gift.annualF2', { defaultValue: 'Save €19.98 vs monthly' }),
        t('gift.annualF3', { defaultValue: 'Priority support included' }),
      ],
    },
    {
      type: 'bundle', months: 12,
      badge: t('gift.bestValue', { defaultValue: 'Best Value' }), badgeColor: 'bg-amber-500',
      icon: <Package className="h-6 w-6" />,
      title: t('gift.bundle', { defaultValue: 'Bundle + Pendant' }),
      desc: t('gift.bundleDesc', { defaultValue: '12 months + an SOS pendant shipped directly to them. Everything they need in one box.' }),
      includesPendant: true,
      tag: t('gift.bundleTag', { defaultValue: '+ ICE SOS Pendant included' }),
      features: [
        t('gift.bundleF1', { defaultValue: '12 months protection' }),
        t('gift.bundleF2', { defaultValue: 'SOS pendant shipped to them' }),
        t('gift.bundleF3', { defaultValue: 'Complete protection package' }),
      ],
    },
    {
      type: 'voucher', months: 12,
      icon: <Heart className="h-6 w-6" />,
      title: t('gift.voucher', { defaultValue: 'Gift Voucher' }),
      desc: t('gift.voucherDesc', { defaultValue: 'A redeemable code they choose when to activate. Perfect as a physical gift.' }),
      features: [
        t('gift.voucherF1', { defaultValue: 'They choose when to activate' }),
        t('gift.voucherF2', { defaultValue: 'Perfect as a physical gift' }),
        t('gift.voucherF3', { defaultValue: 'Never expires' }),
      ],
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const isFormValid = () => {
    if (!selectedType) return false;
    if (!recipientName.trim()) return false;
    if (!recipientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return false;
    if (!purchaserName.trim()) return false;
    if (!purchaserEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaserEmail)) return false;
    if (personalMessage.length > 500) return false;
    if (deliveryDate && deliveryDate < todayStr) return false;
    return true;
  };

  const handlePurchase = async () => {
    if (!isFormValid() || !selectedType) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gift-checkout', {
        body: {
          gift_type: selectedType,
          recipient_email: recipientEmail.trim(),
          recipient_name: recipientName.trim(),
          personal_message: personalMessage.trim() || null,
          delivery_date: deliveryDate || null,
          purchaser_name: purchaserName.trim(),
          purchaser_email: purchaserEmail.trim(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) { window.location.href = data.url; }
      else { throw new Error('No checkout URL returned'); }
    } catch (err) {
      toast({
        title: t('gift.purchaseError', { defaultValue: 'Purchase failed' }),
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const personas = [
    {
      emoji: '\uD83D\uDC69\u200D\uD83E\uDDB3',
      title: t('gift.mumTitle', { defaultValue: 'Your Mum' }),
      scenario: t('gift.mumScenario', { defaultValue: "She lives alone and you worry when she doesn't answer her phone. CLARA means you'll always know she's safe." }),
      tag: t('gift.mumTag', { defaultValue: 'Most popular gift' }),
      tagColor: 'bg-red-50 text-red-600 border-red-200',
      bgColor: 'bg-red-50',
    },
    {
      emoji: '\uD83D\uDC68\u200D\uD83E\uDDB3',
      title: t('gift.dadTitle', { defaultValue: 'Your Dad' }),
      scenario: t('gift.dadScenario', { defaultValue: "He's independent and proud of it. CLARA keeps him protected without making him feel watched." }),
      tag: t('gift.dadTag', { defaultValue: 'Highly rated' }),
      tagColor: 'bg-blue-50 text-blue-600 border-blue-200',
      bgColor: 'bg-blue-50',
    },
    {
      emoji: '\uD83D\uDC91',
      title: t('gift.partnerTitle', { defaultValue: 'Your Partner' }),
      scenario: t('gift.partnerScenario', { defaultValue: 'Whether they travel for work, run alone, or just want extra peace of mind \u2014 CLARA is always there.' }),
      tag: t('gift.partnerTag', { defaultValue: 'Thoughtful gift' }),
      tagColor: 'bg-purple-50 text-purple-600 border-purple-200',
      bgColor: 'bg-purple-50',
    },
    {
      emoji: '\uD83D\uDC74\uD83D\uDC75',
      title: t('gift.grandparentTitle', { defaultValue: 'A Grandparent' }),
      scenario: t('gift.grandparentScenario', { defaultValue: 'Simple to use, always on. CLARA speaks to them warmly and alerts the family the moment help is needed.' }),
      tag: t('gift.grandparentTag', { defaultValue: 'Easy to set up' }),
      tagColor: 'bg-green-50 text-green-600 border-green-200',
      bgColor: 'bg-green-50',
    },
    {
      emoji: '\uD83D\uDC77',
      title: t('gift.colleagueTitle', { defaultValue: 'A Colleague' }),
      scenario: t('gift.colleagueScenario', { defaultValue: 'Working alone on site or remotely? CLARA provides instant SOS and check-ins for lone workers.' }),
      tag: t('gift.colleagueTag', { defaultValue: 'Duty of care' }),
      tagColor: 'bg-amber-50 text-amber-600 border-amber-200',
      bgColor: 'bg-amber-50',
    },
    {
      emoji: '\u2764\uFE0F',
      title: t('gift.anyoneTitle', { defaultValue: 'Someone You Love' }),
      scenario: t('gift.anyoneScenario', { defaultValue: "You know them best. Whatever their situation \u2014 CLARA provides the protection you've been looking for." }),
      tag: t('gift.anyoneTag', { defaultValue: 'Universal' }),
      tagColor: 'bg-gray-100 text-gray-600 border-gray-200',
      bgColor: 'bg-gray-100',
    },
  ];

  const howItWorksSteps = [
    {
      icon: CreditCard,
      title: t('gift.step1Title', { defaultValue: 'You complete the gift' }),
      desc: t('gift.step1Desc', { defaultValue: 'Choose a package, enter their name and email. Takes 2 minutes.' }),
    },
    {
      icon: Mail,
      title: t('gift.step2Title', { defaultValue: 'They get a beautiful email' }),
      desc: t('gift.step2Desc', { defaultValue: 'A warm gift email arrives instantly with everything they need to get started.' }),
    },
    {
      icon: Shield,
      title: t('gift.step3Title', { defaultValue: 'CLARA is ready' }),
      desc: t('gift.step3Desc', { defaultValue: "They click one button, CLARA activates, and they're protected from that moment on." }),
    },
  ];

  const testimonials = [
    {
      quote: t('gift.testimonial1Quote', { defaultValue: "I bought this for my mum after she had a fall last year. Knowing CLARA is watching over her means I actually sleep at night now. Best money I've ever spent." }),
      name: 'James T.',
      location: t('gift.testimonial1Location', { defaultValue: 'Amsterdam \u2192 Mum in M\u00e1laga' }),
      initials: 'JT',
      color: 'bg-red-100 text-red-700',
    },
    {
      quote: t('gift.testimonial2Quote', { defaultValue: "Dad refused every other solution \u2014 said he didn't need help. But he loves talking to CLARA. She checks in without making him feel like a burden. That's the bit that got me." }),
      name: 'Sarah M.',
      location: t('gift.testimonial2Location', { defaultValue: 'London \u2192 Dad in Edinburgh' }),
      initials: 'SM',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      quote: t('gift.testimonial3Quote', { defaultValue: 'I got the bundle for my grandmother\'s 80th birthday. She wore the pendant the same day. The whole family feels different now \u2014 more connected, less anxious.' }),
      name: 'Miguel R.',
      location: t('gift.testimonial3Location', { defaultValue: 'Madrid \u2192 Abuela in Seville' }),
      initials: 'MR',
      color: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={t('gift.seoTitle', { defaultValue: 'Gift LifeLink Sync \u2014 Give the Gift of Safety' })}
        description={t('gift.seoDesc', { defaultValue: 'Give someone you love 24/7 emergency protection with CLARA AI.' })}
      />
      <Navigation />

      {/* ── SECTION 1: Hero ─────────────────────────────────── */}
      <section className="bg-[#FAFAF9] pt-32 pb-16 text-center relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 lg:w-80 lg:h-80 bg-primary/3 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-100 mb-6">
            <Gift className="h-3.5 w-3.5" />
            {t('gift.giftHeroLabel', { defaultValue: 'Gift Protection' })}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 leading-tight text-[hsl(215,25%,27%)]">
            {t('gift.giftHeadline', { defaultValue: 'The most meaningful gift you can give someone you love.' })}
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed font-inter">
            {t('gift.giftSubtitle', { defaultValue: 'CLARA watches over them 24/7 \u2014 so you can stop worrying.' })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 mt-8">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-red-500" /> {t('gift.giftTrust1', { defaultValue: 'No card needed to redeem' })}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-red-500" /> {t('gift.giftTrust2', { defaultValue: 'Active within minutes' })}</span>
            <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-red-500" /> {t('gift.giftTrust3', { defaultValue: 'Loved by families across Europe' })}</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Perfect For... ──────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[hsl(215,25%,27%)] font-poppins mb-3">
              {t('gift.perfectFor', { defaultValue: 'Perfect for someone special' })}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {personas.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 bg-white border border-gray-200 hover:shadow-lg hover:border-red-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-16 h-16 rounded-2xl ${p.bgColor} flex items-center justify-center text-3xl mb-4`}>
                  {p.emoji}
                </div>
                <h3 className="text-lg font-semibold text-[hsl(215,25%,27%)] mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 font-inter">{p.scenario}</p>
                <Badge className={`text-[10px] border ${p.tagColor}`}>{p.tag}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Choose Your Gift ────────────────────── */}
      <section className="py-16 bg-[#F3F4F6]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[hsl(215,25%,27%)] font-poppins mb-2">
              {t('gift.giftChoose', { defaultValue: 'Choose your gift' })}
            </h2>
            <p className="text-gray-500 text-sm font-inter">
              {t('gift.everyOption', { defaultValue: 'Every option includes a 7-day free trial for the recipient.' })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => {
              const isSelected = selectedType === pkg.type;
              return (
                <button
                  key={pkg.type}
                  onClick={() => setSelectedType(pkg.type)}
                  className={`relative rounded-2xl p-6 text-left transition-all duration-200 border ${
                    isSelected
                      ? 'border-red-500 ring-2 ring-red-500 ring-offset-2 bg-red-50 shadow-md'
                      : 'border-gray-200 bg-white shadow-sm hover:border-red-300 hover:shadow-md'
                  }`}
                >
                  {pkg.badge && (
                    <Badge className={`absolute -top-2.5 left-4 ${pkg.badgeColor} text-white text-[10px] px-2.5 py-0.5`}>
                      {pkg.badge}
                    </Badge>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-500 mb-4">
                    {pkg.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{pkg.title}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-red-600">{formatPrice(GIFT_PRICES[pkg.type])}</span>
                  </div>
                  {pkg.saving && <p className="text-xs text-green-600 mb-2">{pkg.saving}</p>}
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{pkg.desc}</p>

                  {/* Feature list */}
                  <ul className="space-y-1.5 mb-3">
                    {pkg.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {pkg.tag && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">{pkg.tag}</Badge>
                  )}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: How It Works for Recipient ──────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[hsl(215,25%,27%)] font-poppins mb-2">
              {t('gift.howItWorksTitle', { defaultValue: 'What happens after you buy' })}
            </h2>
            <p className="text-gray-500 font-inter">
              {t('gift.howItWorksSubtitle', { defaultValue: 'Simple for you. Even simpler for them.' })}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting dashed line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] border-t-2 border-dashed border-gray-200" />

            {howItWorksSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="text-center relative">
                  <div className="w-10 h-10 rounded-full bg-red-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-4 relative z-10 shadow-md shadow-red-500/20">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-[hsl(215,25%,27%)] mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[240px] mx-auto font-inter">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Personalise + Form ──────────────────── */}
      {selectedType && (
        <section className="py-16 bg-[#F3F4F6]" id="gift-form">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[hsl(215,25%,27%)] font-poppins mb-2">
                {t('gift.personaliseTitle', { defaultValue: 'Personalise your gift' })}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left column — Recipient details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  {t('gift.giftWhoFor', { defaultValue: 'Who is this for?' })}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">
                      {t('gift.recipientName', { defaultValue: 'Recipient name' })} *
                    </Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t('gift.recipientNamePlaceholder', { defaultValue: 'e.g. Margaret' })}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">
                      {t('gift.recipientEmail', { defaultValue: 'Recipient email' })} *
                    </Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. margaret@email.com"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">
                      {t('gift.yourName', { defaultValue: 'Your name' })} *
                    </Label>
                    <Input
                      value={purchaserName}
                      onChange={(e) => setPurchaserName(e.target.value)}
                      placeholder={t('gift.yourNamePlaceholder', { defaultValue: 'So they know who it\'s from' })}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">
                      {t('gift.yourEmail', { defaultValue: 'Your email' })} *
                    </Label>
                    <Input
                      type="email"
                      value={purchaserEmail}
                      onChange={(e) => setPurchaserEmail(e.target.value)}
                      placeholder="e.g. james@email.com"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">
                      {t('gift.deliveryDate', { defaultValue: 'Delivery date (optional)' })}
                    </Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={todayStr}
                      className="bg-white border-gray-300 text-gray-900 focus:border-red-500"
                    />
                    <p className="text-xs text-gray-400">
                      {t('gift.deliveryDateHint', { defaultValue: 'Leave empty to send immediately after purchase' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right column — Personal message */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {t('gift.giftPersonalMessage', { defaultValue: 'Add a personal message' })}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {t('gift.messageSubtext', { defaultValue: "We'll include this in their gift email" })}
                </p>
                <Textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder={t('gift.messagePlaceholder', { defaultValue: "e.g. Mum, I set this up because I want to know you're safe. I love you. \u2014 James" })}
                  maxLength={300}
                  rows={5}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{personalMessage.length}/300</p>

                {/* Order summary preview */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {t('gift.orderSummary', { defaultValue: 'Order summary' })}
                  </h4>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{packages.find(p => p.type === selectedType)?.title}</span>
                    <span className="font-semibold text-gray-900">{formatPrice(GIFT_PRICES[selectedType])}</span>
                  </div>
                  {recipientName && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t('gift.forRecipient', { defaultValue: 'For' })}: {recipientName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkout button */}
            <div className="mt-8 max-w-lg mx-auto">
              <Button
                onClick={handlePurchase}
                disabled={!isFormValid() || isProcessing}
                size="lg"
                className="w-full text-lg py-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('gift.processing', { defaultValue: 'Processing...' })}
                  </>
                ) : (
                  <>
                    {t('gift.sendGift', { defaultValue: 'Send this gift' })} \u2192 {formatPrice(GIFT_PRICES[selectedType])}
                  </>
                )}
              </Button>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {t('gift.securePayment', { defaultValue: 'Secure payment via Stripe' })}</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {t('gift.instantEmail', { defaultValue: 'Gift email sent instantly' })}</span>
                <span className="flex items-center gap-1">&crarr; {t('gift.refundPolicy', { defaultValue: 'Full refund within 7 days if unused' })}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 6: Testimonials ────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[hsl(215,25%,27%)] font-poppins">
              {t('gift.testimonialsTitle', { defaultValue: 'Families who gave the gift of peace of mind' })}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative"
              >
                {/* Decorative quote mark */}
                <span className="text-red-100 text-8xl font-serif leading-none absolute top-4 left-6 select-none" aria-hidden="true">
                  &ldquo;
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4 relative z-10">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-red-500 text-red-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6 relative z-10 font-inter">
                  {item.quote}
                </p>

                {/* Attribution */}
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-sm font-bold`}>
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Bottom CTA ──────────────────────────── */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <Gift className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white font-poppins mb-4">
            {t('gift.bottomCtaTitle', { defaultValue: 'Give the gift they\'ll thank you for every day' })}
          </h2>
          <p className="text-gray-400 mb-8 font-inter">
            {t('gift.bottomCtaSubtitle', { defaultValue: 'Protection starts the moment they open your gift.' })}
          </p>
          <Button
            onClick={() => {
              const el = document.getElementById('gift-form');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-red-500/20"
          >
            <Gift className="h-5 w-5 mr-2" />
            {t('gift.bottomCtaButton', { defaultValue: 'Start gifting now' })}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GiftPurchasePage;
