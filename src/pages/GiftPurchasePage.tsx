import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Shield, Heart, Clock, Package, Loader2, Check, ArrowLeft } from 'lucide-react';
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
  icon: React.ReactNode;
  includesPendant?: boolean;
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

  // Pre-fill purchaser if logged in
  React.useEffect(() => {
    if (user?.email) {
      setPurchaserEmail(user.email);
    }
    if (user) {
      supabase.from('profiles').select('first_name, last_name').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.first_name) {
            setPurchaserName(`${data.first_name}${data.last_name ? ' ' + data.last_name : ''}`);
          }
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
    { type: 'monthly', months: 1, icon: <Clock className="h-6 w-6" /> },
    { type: 'annual', months: 12, badge: t('gift.mostPopular', { defaultValue: 'Most Popular' }), icon: <Shield className="h-6 w-6" /> },
    { type: 'bundle', months: 12, badge: t('gift.bestValue', { defaultValue: 'Best Value' }), icon: <Package className="h-6 w-6" />, includesPendant: true },
    { type: 'voucher', months: 12, icon: <Heart className="h-6 w-6" /> },
  ];

  const getPackageTitle = (type: GiftType): string => {
    const titles: Record<GiftType, string> = {
      monthly: t('gift.monthlyTitle', { defaultValue: '1 Month Gift' }),
      annual: t('gift.annualTitle', { defaultValue: '12 Month Gift' }),
      bundle: t('gift.bundleTitle', { defaultValue: 'Bundle + Pendant' }),
      voucher: t('gift.voucherTitle', { defaultValue: 'Gift Voucher' }),
    };
    return titles[type];
  };

  const getPackageDesc = (type: GiftType): string => {
    const descs: Record<GiftType, string> = {
      monthly: t('gift.monthlyDesc', { defaultValue: '1 month of CLARA AI protection' }),
      annual: t('gift.annualDesc', { defaultValue: '12 months of full protection' }),
      bundle: t('gift.bundleDesc', { defaultValue: '12 months + ICE SOS Pendant' }),
      voucher: t('gift.voucherDesc', { defaultValue: 'Flexible gift — recipient chooses' }),
    };
    return descs[type];
  };

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

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      toast({
        title: t('gift.purchaseError', { defaultValue: 'Purchase failed' }),
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('gift.seoTitle', { defaultValue: 'Gift LifeLink Sync — Give the Gift of Safety' })}
        description={t('gift.seoDesc', { defaultValue: 'Give someone you love 24/7 emergency protection with CLARA AI.' })}
      />
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              {t('gift.heroTitle', { defaultValue: 'Give the Gift of Safety' })}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('gift.heroSubtitle', { defaultValue: 'Protect someone you love with 24/7 CLARA AI emergency protection. No credit card needed to redeem.' })}
            </p>
          </div>

          {/* Package Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center">
              {t('gift.choosePackage', { defaultValue: 'Choose a gift package' })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === pkg.type
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedType(pkg.type)}
                >
                  <CardContent className="p-5 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      {pkg.icon}
                    </div>
                    {pkg.badge && (
                      <Badge className="bg-primary/10 text-primary text-xs">{pkg.badge}</Badge>
                    )}
                    <h3 className="font-semibold">{getPackageTitle(pkg.type)}</h3>
                    <p className="text-2xl font-bold text-primary">{formatPrice(GIFT_PRICES[pkg.type])}</p>
                    <p className="text-xs text-muted-foreground">{getPackageDesc(pkg.type)}</p>
                    {pkg.includesPendant && (
                      <Badge variant="secondary" className="text-xs">
                        {t('gift.includesPendant', { defaultValue: '+ ICE SOS Pendant' })}
                      </Badge>
                    )}
                    {selectedType === pkg.type && (
                      <div className="flex items-center justify-center text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Gift Form — only show after package selected */}
          {selectedType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('gift.recipientDetails', { defaultValue: 'Gift Details' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Recipient */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t('gift.recipientSection', { defaultValue: 'Recipient' })}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient-name">{t('gift.recipientName', { defaultValue: 'Recipient name' })} *</Label>
                      <Input
                        id="recipient-name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder={t('gift.recipientNamePlaceholder', { defaultValue: 'Their full name' })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipient-email">{t('gift.recipientEmail', { defaultValue: 'Recipient email' })} *</Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder={t('gift.recipientEmailPlaceholder', { defaultValue: 'their@email.com' })}
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Message */}
                <div className="space-y-2">
                  <Label htmlFor="personal-message">
                    {t('gift.personalMessage', { defaultValue: 'Personal message (optional)' })}
                  </Label>
                  <Textarea
                    id="personal-message"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder={t('gift.personalMessagePlaceholder', { defaultValue: 'Add a personal note to your gift...' })}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">{personalMessage.length}/500</p>
                </div>

                {/* Delivery Date */}
                <div className="space-y-2">
                  <Label htmlFor="delivery-date">
                    {t('gift.deliveryDate', { defaultValue: 'Delivery date (optional)' })}
                  </Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={todayStr}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('gift.deliveryDateHint', { defaultValue: 'Leave empty to send immediately after purchase' })}
                  </p>
                </div>

                {/* Purchaser */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t('gift.purchaserSection', { defaultValue: 'Your Details' })}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaser-name">{t('gift.purchaserName', { defaultValue: 'Your name' })} *</Label>
                      <Input
                        id="purchaser-name"
                        value={purchaserName}
                        onChange={(e) => setPurchaserName(e.target.value)}
                        placeholder={t('gift.purchaserNamePlaceholder', { defaultValue: 'Your full name' })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaser-email">{t('gift.purchaserEmail', { defaultValue: 'Your email' })} *</Label>
                      <Input
                        id="purchaser-email"
                        type="email"
                        value={purchaserEmail}
                        onChange={(e) => setPurchaserEmail(e.target.value)}
                        placeholder={t('gift.purchaserEmailPlaceholder', { defaultValue: 'your@email.com' })}
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="pt-4">
                  <Button
                    onClick={handlePurchase}
                    disabled={!isFormValid() || isProcessing}
                    size="lg"
                    className="w-full text-lg py-6"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t('gift.processing', { defaultValue: 'Processing...' })}
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5 mr-2" />
                        {t('gift.purchaseButton', { defaultValue: 'Purchase Gift' })} — {formatPrice(GIFT_PRICES[selectedType])}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {t('gift.securePayment', { defaultValue: 'Secure payment via Stripe. You will be redirected to complete payment.' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back link */}
          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('gift.backToHome', { defaultValue: 'Back to home' })}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GiftPurchasePage;
