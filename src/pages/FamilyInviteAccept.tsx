import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Users, Check, X, AlertCircle, MapPin, Bell, Heart, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

interface FamilyInvite {
  id: string;
  invitee_email: string;
  invitee_name: string;
  inviter_email: string;
  relationship: string;
  billing_type: 'owner' | 'self';
  status: string;
  created_at: string;
  expires_at: string;
  group_id: string;
}

type PageState = 'loading' | 'valid' | 'expired' | 'already_accepted' | 'not_found' | 'error';

const FamilyInviteAccept = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [invite, setInvite] = useState<FamilyInvite | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [accepting, setAccepting] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);

  useEffect(() => {
    if (token) loadInvite();
  }, [token]);

  const loadInvite = async () => {
    try {
      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        setPageState('not_found');
        return;
      }

      if (data.status === 'accepted') {
        setPageState('already_accepted');
        return;
      }

      if (data.status !== 'pending') {
        setPageState('not_found');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setPageState('expired');
        setInvite(data as FamilyInvite);
        return;
      }

      setInvite(data as FamilyInvite);
      setPageState('valid');
    } catch {
      setPageState('error');
    }
  };

  const acceptInvite = async () => {
    if (!invite || !gdprConsent) return;

    // Self-paid: redirect to Stripe checkout
    if (invite.billing_type === 'self') {
      setAccepting(true);
      try {
        const { data, error } = await supabase.functions.invoke('family-subscription-checkout', {
          body: {
            email: invite.invitee_email,
            billing_type: 'self',
            invite_token: token,
          }
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error('No checkout URL returned');
      } catch (error) {
        toast({
          title: t('family.errorTitle'),
          description: t('familyInvite.checkoutFailed'),
          variant: "destructive"
        });
        setAccepting(false);
        return;
      }
    }

    // Owner-paid: activate immediately
    if (!user) {
      // Need to sign in first
      navigate('/onboarding', { state: { returnTo: `/family-invite/${token}` } });
      return;
    }

    setAccepting(true);
    try {
      const { error } = await supabase.functions.invoke('family-invite-management', {
        body: {
          action: 'accept',
          invite_id: invite.id,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: t('familyInvite.welcomeToast'),
        description: t('familyInvite.welcomeToastDesc'),
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: t('family.errorTitle'),
        description: t('family.failedToAccept'),
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  const declineInvite = async () => {
    if (!invite) return;
    try {
      await supabase.functions.invoke('family-invite-management', {
        body: { action: 'decline', invite_id: invite.id }
      });
      toast({
        title: t('family.invitationDeclinedTitle'),
        description: t('family.invitationDeclinedDescription'),
      });
      navigate('/');
    } catch {
      toast({
        title: t('family.errorTitle'),
        description: t('family.failedToDecline'),
        variant: "destructive"
      });
    }
  };

  // ── Loading state ─────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // ── Error states ──────────────────────────────
  if (pageState === 'not_found' || pageState === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('familyInvite.errorTitle')} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="text-xl">{t('familyInvite.invalidTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{t('familyInvite.invalidDesc')}</p>
                <Button onClick={() => navigate('/')}>{t('family.returnHome')}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('familyInvite.expiredTitle')} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl">{t('familyInvite.expiredTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {t('familyInvite.expiredDesc')}
                </p>
                <Button onClick={() => navigate('/')}>{t('family.returnHome')}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (pageState === 'already_accepted') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t('familyInvite.alreadyAcceptedTitle')} description="" />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-xl">{t('familyInvite.alreadyAcceptedTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{t('familyInvite.alreadyAcceptedDesc')}</p>
                <Button onClick={() => navigate('/dashboard')}>{t('familyInvite.goToDashboard')}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Valid invite — main acceptance UI ─────────
  if (!invite) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('familyInvite.seoTitle')}
        description={t('familyInvite.seoDesc')}
      />
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Hero Card */}
          <Card className="overflow-hidden border-2 border-primary/20">
            <CardHeader className="text-center bg-gradient-to-b from-primary/5 to-background pb-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {t('familyInvite.welcomeTitle')}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {t('familyInvite.welcomeSubtitle', { name: invite.invitee_name })}
              </p>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Invite Details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('family.invitedBy')}</span>
                  <span className="font-medium">{invite.inviter_email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('family.relationship')}</span>
                  <Badge variant="outline">{invite.relationship}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('familyInvite.billingLabel')}</span>
                  <Badge variant={invite.billing_type === 'owner' ? 'default' : 'secondary'}>
                    {invite.billing_type === 'owner'
                      ? t('familyInvite.billingOwnerPaid')
                      : t('familyInvite.billingSelfPaid')
                    }
                  </Badge>
                </div>
              </div>

              {/* What you get */}
              <div>
                <h3 className="font-semibold mb-3">{t('familyInvite.whatYouGet')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t('familyInvite.featureSosAlerts')}</p>
                      <p className="text-xs text-muted-foreground">{t('familyInvite.featureSosAlertsDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t('familyInvite.featureLiveMap')}</p>
                      <p className="text-xs text-muted-foreground">{t('familyInvite.featureLiveMapDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t('familyInvite.featureClara')}</p>
                      <p className="text-xs text-muted-foreground">{t('familyInvite.featureClaraDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t('familyInvite.featureCircle')}</p>
                      <p className="text-xs text-muted-foreground">{t('familyInvite.featureCircleDesc')}</p>
                    </div>
                  </div>
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
                    {t('familyInvite.gdprConsent')}{' '}
                    <a href="/privacy" target="_blank" className="text-primary underline">
                      {t('familyInvite.privacyPolicyLink')}
                    </a>
                  </label>
                </div>
              </div>

              {/* Self-paid billing notice */}
              {invite.billing_type === 'self' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {t('familyInvite.selfPaidNotice')}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!user && invite.billing_type === 'owner' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 mb-3">
                    {t('familyInvite.signInRequired')}
                  </p>
                  <Button
                    onClick={() => navigate('/onboarding', { state: { returnTo: `/family-invite/${token}` } })}
                    disabled={!gdprConsent}
                  >
                    {t('familyInvite.signInToAccept')}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={acceptInvite}
                    disabled={accepting || !gdprConsent}
                    className="flex-1"
                    size="lg"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('familyInvite.activating')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {invite.billing_type === 'self'
                          ? t('familyInvite.acceptAndPay')
                          : t('familyInvite.acceptAndJoin')
                        }
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={declineInvite}
                    size="lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('family.decline')}
                  </Button>
                </div>
              )}

              {!gdprConsent && (
                <p className="text-xs text-muted-foreground text-center">
                  {t('familyInvite.gdprRequired')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground text-center">
            {t('familyInvite.privacyNote')}
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FamilyInviteAccept;
