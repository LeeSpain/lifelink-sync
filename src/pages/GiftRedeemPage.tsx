import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift, Shield, Check, Clock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

type PageState = 'loading' | 'enter_code' | 'valid' | 'already_redeemed' | 'expired' | 'not_found' | 'success' | 'error';

interface GiftInfo {
  id: string;
  purchaser_name: string | null;
  gift_type: string;
  personal_message: string | null;
  amount_paid: number;
  expires_at: string;
  status: string;
}

const GIFT_TYPE_LABELS: Record<string, { label: string; months: number }> = {
  monthly: { label: '1 Month LifeLink Sync', months: 1 },
  annual: { label: '12 Months LifeLink Sync', months: 12 },
  bundle: { label: '12 Months + ICE SOS Pendant', months: 12 },
  voucher: { label: 'LifeLink Sync Gift Voucher', months: 12 },
};

// Validate redeem code format: LL-XXXX-XXXX-XXXX (no ambiguous chars 0/O/1/I/L)
const CODE_REGEX = /^LL-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const GiftRedeemPage: React.FC = () => {
  const { t } = useTranslation();
  const { code: urlCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [codeInput, setCodeInput] = useState('');
  const [gift, setGift] = useState<GiftInfo | null>(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const returnPath = urlCode ? `/gift/redeem/${urlCode}` : '/gift/redeem';
      navigate(`/auth?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (urlCode) {
      lookupCode(urlCode);
    } else {
      setPageState('enter_code');
    }
  }, [urlCode, user, authLoading]);

  const lookupCode = async (code: string) => {
    setPageState('loading');

    const normalizedCode = code.toUpperCase().trim();

    if (!CODE_REGEX.test(normalizedCode)) {
      setPageState('not_found');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gift_subscriptions')
        .select('id, purchaser_name, gift_type, personal_message, amount_paid, expires_at, status')
        .eq('redeem_code', normalizedCode)
        .maybeSingle();

      if (error || !data) {
        setPageState('not_found');
        return;
      }

      setGift(data as GiftInfo);

      if (data.status === 'redeemed') {
        setPageState('already_redeemed');
      } else if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
        setPageState('expired');
      } else if (data.status === 'delivered' || data.status === 'paid') {
        setPageState('valid');
      } else {
        setPageState('not_found');
      }
    } catch {
      setPageState('error');
    }
  };

  const handleManualLookup = () => {
    if (codeInput.trim()) {
      lookupCode(codeInput.trim());
    }
  };

  const handleActivate = async () => {
    if (!gift || !gdprConsent || !user) return;

    setIsActivating(true);
    try {
      const code = urlCode || codeInput.trim();
      const { data, error } = await supabase.functions.invoke('redeem-gift', {
        body: {
          redeem_code: code.toUpperCase().trim(),
          gdpr_consent: true,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setPageState('success');
      toast({
        title: t('gift.redeemSuccess', { defaultValue: 'Gift activated!' }),
        description: t('gift.redeemSuccessDesc', { defaultValue: 'Your subscription is now active.' }),
      });
    } catch (err) {
      toast({
        title: t('gift.redeemError', { defaultValue: 'Activation failed' }),
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
      setIsActivating(false);
    }
  };

  // Format code as user types: LL-XXXX-XXXX-XXXX
  const handleCodeChange = (value: string) => {
    // Strip everything except valid chars and dashes
    let cleaned = value.toUpperCase().replace(/[^A-HJ-NP-Z2-9L-]/g, '');

    // Auto-format with dashes
    if (cleaned.length > 2 && cleaned[2] !== '-') {
      cleaned = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    }
    if (cleaned.length > 7 && cleaned[7] !== '-') {
      cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
    }
    if (cleaned.length > 12 && cleaned[12] !== '-') {
      cleaned = cleaned.slice(0, 12) + '-' + cleaned.slice(12);
    }

    // Limit length
    if (cleaned.length > 17) cleaned = cleaned.slice(0, 17);

    setCodeInput(cleaned);
  };

  // ── Loading ─────────────────────────────
  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // ── Enter Code ──────────────────────────
  if (pageState === 'enter_code') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('gift.redeemSeoTitle', { defaultValue: 'Redeem Your Gift — LifeLink Sync' })} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('gift.redeemTitle', { defaultValue: 'Redeem Your Gift' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {t('gift.redeemEnterCode', { defaultValue: 'Enter the redemption code from your gift email.' })}
                </p>
                <Input
                  value={codeInput}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="LL-XXXX-XXXX-XXXX"
                  className="text-center font-mono text-lg tracking-wider"
                  maxLength={17}
                />
                <Button
                  onClick={handleManualLookup}
                  disabled={codeInput.length < 17}
                  className="w-full"
                >
                  {t('gift.lookupButton', { defaultValue: 'Look up gift' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Not Found ───────────────────────────
  if (pageState === 'not_found' || pageState === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('gift.redeemSeoTitle', { defaultValue: 'Redeem Your Gift — LifeLink Sync' })} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="text-xl">{t('gift.redeemNotFoundTitle', { defaultValue: 'Invalid Gift Code' })}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {t('gift.redeemNotFoundDesc', { defaultValue: 'This gift code was not found. Please check the code and try again. Codes are in the format LL-XXXX-XXXX-XXXX.' })}
                </p>
                <Button onClick={() => { setPageState('enter_code'); setCodeInput(''); }}>
                  {t('gift.tryAgain', { defaultValue: 'Try another code' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Expired ─────────────────────────────
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('gift.redeemSeoTitle', { defaultValue: 'Redeem Your Gift — LifeLink Sync' })} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl">{t('gift.redeemExpiredTitle', { defaultValue: 'Gift Code Expired' })}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {t('gift.redeemExpiredDesc', { defaultValue: 'This gift code has expired. Gift codes are valid for 12 months from the date of purchase. Please contact the person who sent you the gift, or reach out to support.' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('gift.contactSupport', { defaultValue: 'Need help?' })}{' '}
                  <a href="mailto:support@lifelink-sync.com" className="text-primary underline">support@lifelink-sync.com</a>
                </p>
                <Button variant="outline" onClick={() => navigate('/')}>
                  {t('gift.backToHome', { defaultValue: 'Back to home' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Already Redeemed ────────────────────
  if (pageState === 'already_redeemed') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('gift.redeemSeoTitle', { defaultValue: 'Redeem Your Gift — LifeLink Sync' })} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-xl">{t('gift.redeemAlreadyTitle', { defaultValue: 'Already Activated' })}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {t('gift.redeemAlreadyDesc', { defaultValue: 'This gift has already been activated. If this is your gift, your subscription should already be active.' })}
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  {t('gift.goToDashboard', { defaultValue: 'Go to dashboard' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Success ─────────────────────────────
  if (pageState === 'success') {
    const giftLabel = gift ? (GIFT_TYPE_LABELS[gift.gift_type]?.label || 'LifeLink Sync') : 'LifeLink Sync';
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('gift.redeemSuccessSeoTitle', { defaultValue: 'Gift Activated — LifeLink Sync' })} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary">
                  {t('gift.redeemSuccessTitle', { defaultValue: 'Your Gift is Active!' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {t('gift.redeemSuccessMessage', {
                    defaultValue: 'Your {{package}} subscription is now active. You are protected by CLARA AI 24/7.',
                    package: giftLabel,
                  })}
                </p>
                {gift?.purchaser_name && (
                  <p className="text-sm text-muted-foreground">
                    {t('gift.giftedBy', { defaultValue: 'Gifted by {{name}}', name: gift.purchaser_name })}
                  </p>
                )}
                <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('gift.goToDashboard', { defaultValue: 'Go to dashboard' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Valid — main activation UI ──────────
  if (!gift) return null;
  const giftLabel = GIFT_TYPE_LABELS[gift.gift_type] || { label: 'LifeLink Sync', months: 1 };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('gift.redeemSeoTitle', { defaultValue: 'Redeem Your Gift — LifeLink Sync' })}
        description=""
      />
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto space-y-6">

          <Card className="overflow-hidden border-2 border-primary/20">
            <CardHeader className="text-center bg-gradient-to-b from-primary/5 to-background pb-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {t('gift.redeemWelcome', { defaultValue: "You've Received a Gift!" })}
              </CardTitle>
              {gift.purchaser_name && (
                <p className="text-muted-foreground mt-2">
                  {t('gift.giftFrom', { defaultValue: 'From {{name}}', name: gift.purchaser_name })}
                </p>
              )}
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Personal message */}
              {gift.personal_message && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <p className="text-sm italic text-amber-900">"{gift.personal_message}"</p>
                </div>
              )}

              {/* Gift details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('gift.packageLabel', { defaultValue: 'Package' })}</span>
                  <Badge variant="secondary">{giftLabel.label}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('gift.durationLabel', { defaultValue: 'Duration' })}</span>
                  <span className="font-medium">{giftLabel.months} {t('gift.months', { defaultValue: 'months' })}</span>
                </div>
              </div>

              {/* What you get */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">{t('gift.whatYouGet', { defaultValue: 'What you get' })}</h3>
                <div className="space-y-1.5">
                  {[
                    t('gift.feature1', { defaultValue: '24/7 CLARA AI protection' }),
                    t('gift.feature2', { defaultValue: 'One-touch SOS emergency button' }),
                    t('gift.feature3', { defaultValue: 'Live location sharing with family' }),
                    t('gift.feature4', { defaultValue: 'Medical profile for first responders' }),
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GDPR Consent */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="gdpr-consent"
                    checked={gdprConsent}
                    onCheckedChange={(checked) => setGdprConsent(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="gdpr-consent" className="text-sm leading-relaxed cursor-pointer">
                    {t('gift.redeemGdprConsent', { defaultValue: 'I agree to the processing of my personal data as described in the' })}{' '}
                    <a href="/privacy" target="_blank" className="text-primary underline">
                      {t('gift.privacyPolicyLink', { defaultValue: 'Privacy Policy' })}
                    </a>
                  </label>
                </div>
              </div>

              {/* Activate button */}
              <Button
                onClick={handleActivate}
                disabled={!gdprConsent || isActivating}
                size="lg"
                className="w-full"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('gift.activating', { defaultValue: 'Activating...' })}
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    {t('gift.activateButton', { defaultValue: 'Activate My Gift' })}
                  </>
                )}
              </Button>

              {!gdprConsent && (
                <p className="text-xs text-muted-foreground text-center">
                  {t('gift.gdprRequired', { defaultValue: 'You must accept the privacy policy to activate your gift.' })}
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {t('gift.noCreditCard', { defaultValue: 'No credit card needed. Your gift is already paid for.' })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GiftRedeemPage;
