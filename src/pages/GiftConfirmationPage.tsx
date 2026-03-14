import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Gift, Copy, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

interface GiftInfo {
  id: string;
  recipient_name: string | null;
  recipient_email: string;
  gift_type: string;
  amount_paid: number;
  personal_message: string | null;
  redeem_code: string;
  delivery_date: string | null;
  delivered_at: string | null;
  status: string;
}

const GIFT_TYPE_LABELS: Record<string, string> = {
  monthly: '1 Month LifeLink Sync',
  annual: '12 Months LifeLink Sync',
  bundle: '12 Months + ICE SOS Pendant',
  voucher: 'LifeLink Sync Gift Voucher',
};

const GiftConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gift, setGift] = useState<GiftInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const giftId = searchParams.get('id');

  useEffect(() => {
    if (!giftId) {
      setLoading(false);
      return;
    }

    const loadGift = async () => {
      try {
        const { data, error } = await supabase
          .from('gift_subscriptions')
          .select('id, recipient_name, recipient_email, gift_type, amount_paid, personal_message, redeem_code, delivery_date, delivered_at, status')
          .eq('id', giftId)
          .maybeSingle();

        if (error) throw error;
        setGift(data as GiftInfo | null);
      } catch {
        // Gift may not be readable if purchaser is not logged in — show generic confirmation
      } finally {
        setLoading(false);
      }
    };

    loadGift();
  }, [giftId]);

  const handleCopyCode = () => {
    if (gift?.redeem_code) {
      navigator.clipboard.writeText(gift.redeem_code);
      toast({ title: t('gift.codeCopied', { defaultValue: 'Code copied!' }) });
    }
  };

  const handleCopyRedeemLink = () => {
    if (gift?.redeem_code) {
      const link = `${window.location.origin}/gift/redeem/${gift.redeem_code}`;
      navigator.clipboard.writeText(link);
      toast({ title: t('gift.linkCopied', { defaultValue: 'Redeem link copied!' }) });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('gift.confirmationSeoTitle', { defaultValue: 'Gift Purchased — LifeLink Sync' })}
        description=""
      />
      <Navigation />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                {t('gift.confirmationTitle', { defaultValue: 'Gift Purchased!' })}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {gift ? (
                <>
                  <p className="text-center text-muted-foreground">
                    {gift.delivery_date && !gift.delivered_at
                      ? t('gift.confirmationScheduled', {
                          defaultValue: 'A gift email will be sent to {{name}} on {{date}}.',
                          name: gift.recipient_name || gift.recipient_email,
                          date: new Date(gift.delivery_date).toLocaleDateString(),
                        })
                      : t('gift.confirmationSent', {
                          defaultValue: 'A gift email has been sent to {{name}} at {{email}}.',
                          name: gift.recipient_name || 'the recipient',
                          email: gift.recipient_email,
                        })
                    }
                  </p>

                  {/* Gift Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('gift.packageLabel', { defaultValue: 'Package' })}</span>
                      <span className="font-medium">{GIFT_TYPE_LABELS[gift.gift_type] || gift.gift_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('gift.amountLabel', { defaultValue: 'Amount' })}</span>
                      <span className="font-medium">{`€${Number(gift.amount_paid).toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('gift.recipientLabel', { defaultValue: 'Recipient' })}</span>
                      <span className="font-medium">{gift.recipient_name || gift.recipient_email}</span>
                    </div>
                    {gift.personal_message && (
                      <div className="pt-2 border-t">
                        <p className="text-sm italic text-muted-foreground">"{gift.personal_message}"</p>
                      </div>
                    )}
                  </div>

                  {/* Redeem Code */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{t('gift.redeemCodeLabel', { defaultValue: 'Redemption code' })}</p>
                    <p className="text-xl font-bold font-mono tracking-widest text-primary">{gift.redeem_code}</p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={handleCopyCode}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        {t('gift.copyCode', { defaultValue: 'Copy code' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopyRedeemLink}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        {t('gift.copyLink', { defaultValue: 'Copy link' })}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">
                  {t('gift.confirmationGeneric', { defaultValue: 'Your gift has been purchased. The recipient will receive an email with instructions to activate their gift.' })}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <Button asChild className="w-full">
                  <Link to="/gift">
                    <Gift className="h-4 w-4 mr-2" />
                    {t('gift.buyAnother', { defaultValue: 'Buy another gift' })}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('gift.backToHome', { defaultValue: 'Back to home' })}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GiftConfirmationPage;
