import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Shield, Heart, Clock, Package, Loader2, Check } from 'lucide-react';
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
      title: '1 Month',
      desc: 'A full month of CLARA AI protection. Perfect for trying it out together.',
    },
    {
      type: 'annual', months: 12,
      badge: 'Most Popular', badgeColor: 'bg-red-500',
      icon: <Shield className="h-6 w-6" />,
      title: '12 Months',
      desc: 'A full year of protection. The most thoughtful gift you can give.',
      saving: 'Save \u20ac19.98 vs monthly',
    },
    {
      type: 'bundle', months: 12,
      badge: 'Best Value', badgeColor: 'bg-amber-500',
      icon: <Package className="h-6 w-6" />,
      title: 'Bundle + Pendant',
      desc: '12 months + an SOS pendant shipped directly to them. Everything they need in one box.',
      includesPendant: true,
      tag: '+ ICE SOS Pendant included',
    },
    {
      type: 'voucher', months: 12,
      icon: <Heart className="h-6 w-6" />,
      title: 'Gift Voucher',
      desc: 'A redeemable code they choose when to activate. Perfect as a physical gift.',
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

  const testimonials = [
    { quote: 'I bought this for my mum in Spain. She was set up in 10 minutes and I finally sleep at night.', name: 'James, 34', city: 'Amsterdam' },
    { quote: "My dad is stubborn about asking for help. CLARA does it for him.", name: 'Sarah, 41', city: 'London' },
    { quote: "Best birthday gift I've ever given. Mum loves talking to CLARA.", name: 'Miguel, 38', city: 'Madrid' },
  ];

  return (
    <div className="min-h-screen bg-[#070f1e] text-white">
      <SEO
        title={t('gift.seoTitle', { defaultValue: 'Gift LifeLink Sync \u2014 Give the Gift of Safety' })}
        description={t('gift.seoDesc', { defaultValue: 'Give someone you love 24/7 emergency protection with CLARA AI.' })}
      />
      <Navigation />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="pt-32 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-sm mb-6 px-4 py-1.5">
            <Gift className="h-3.5 w-3.5 mr-1.5" />
            {t('gift.giftHeroLabel', { defaultValue: 'Gift Protection' })}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 leading-tight">
            {t('gift.giftHeadline', { defaultValue: 'The best gift you can give someone you love is peace of mind.' })}
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t('gift.giftSubtitle', { defaultValue: "Set up CLARA for someone special. They get 24/7 AI emergency protection. You get the peace of mind you've been looking for." })}
          </p>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────── */}
      <div className="border-y border-white/5 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-red-400" /> {t('gift.giftTrust1', { defaultValue: 'No card needed to redeem' })}</span>
            <span className="hidden sm:block text-white/10">|</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-red-400" /> {t('gift.giftTrust2', { defaultValue: 'Active within minutes' })}</span>
            <span className="hidden sm:block text-white/10">|</span>
            <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-red-400" /> {t('gift.giftTrust3', { defaultValue: 'Trusted by families across Europe' })}</span>
          </div>
        </div>
      </div>

      {/* ── Gift Cards ────────────────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('gift.giftChoose', { defaultValue: 'Choose your gift' })}</h2>
            <p className="text-gray-500 text-sm">Every option includes a 7-day free trial for the recipient.</p>
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
                      ? 'border-red-500 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                      : 'border-white/[0.08] bg-[#0d1627] hover:border-red-500/40'
                  }`}
                >
                  {pkg.badge && (
                    <Badge className={`absolute -top-2.5 left-4 ${pkg.badgeColor} text-white text-[10px] px-2.5 py-0.5`}>
                      {pkg.badge}
                    </Badge>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
                    {pkg.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{pkg.title}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-white">{formatPrice(GIFT_PRICES[pkg.type])}</span>
                  </div>
                  {pkg.saving && <p className="text-xs text-green-400 mb-2">{pkg.saving}</p>}
                  <p className="text-sm text-gray-400 leading-relaxed">{pkg.desc}</p>
                  {pkg.tag && (
                    <Badge className="mt-3 bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">{pkg.tag}</Badge>
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

      {/* ── Form (shows after card selected) ──────────────── */}
      {selectedType && (
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-2xl">

            {/* Personal Message */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-1">{t('gift.giftPersonalMessage', { defaultValue: 'Add a personal message' })}</h3>
              <p className="text-sm text-gray-500 mb-4">Optional — included with the gift email.</p>
              <Textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="e.g. Mum, I set this up because I love you and want to know you're safe. — James"
                maxLength={500}
                rows={3}
                className="bg-[#0d1627] border-white/10 text-white placeholder:text-gray-600 focus:border-red-500 resize-none"
              />
              <p className="text-xs text-gray-600 text-right mt-1">{personalMessage.length}/500</p>
            </div>

            {/* Recipient */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-1">{t('gift.giftWhoFor', { defaultValue: 'Who is this gift for?' })}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Recipient name *</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Margaret"
                    className="bg-[#0d1627] border-white/10 text-white placeholder:text-gray-600 focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Recipient email *</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. margaret@email.com"
                    className="bg-[#0d1627] border-white/10 text-white placeholder:text-gray-600 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Purchaser */}
            <div className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Your name *</Label>
                  <Input
                    value={purchaserName}
                    onChange={(e) => setPurchaserName(e.target.value)}
                    placeholder="e.g. James"
                    className="bg-[#0d1627] border-white/10 text-white placeholder:text-gray-600 focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Your email *</Label>
                  <Input
                    type="email"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    placeholder="e.g. james@email.com"
                    className="bg-[#0d1627] border-white/10 text-white placeholder:text-gray-600 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="mb-10">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Delivery date (optional)</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={todayStr}
                  className="bg-[#0d1627] border-white/10 text-white focus:border-red-500 max-w-xs"
                />
                <p className="text-xs text-gray-600">Leave empty to send immediately after purchase</p>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handlePurchase}
              disabled={!isFormValid() || isProcessing}
              size="lg"
              className="w-full text-lg py-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all duration-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {t('gift.giftSend', { defaultValue: 'Send Gift' })} — {formatPrice(GIFT_PRICES[selectedType])}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-600 text-center mt-3">
              Secure payment via Stripe. Recipient gets a beautiful email with their gift code instantly.
            </p>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="text-center">
                <p className="text-gray-400 italic text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <p className="text-xs text-gray-600">— {t.name}, {t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GiftPurchasePage;
