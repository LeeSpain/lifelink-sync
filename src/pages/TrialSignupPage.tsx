import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedSubscription } from '@/hooks/useOptimizedSubscription';

const TrialSignupPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: subscription } = useOptimizedSubscription();
  const [isActivating, setIsActivating] = useState(false);

  // Redirect unauthenticated users to registration with trial pre-selected
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/register?trial=true', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleActivateTrial = async () => {
    if (!user) {
      navigate('/register?trial=true');
      return;
    }

    setIsActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('activate-trial');

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: t('checkout.trialActivated'),
        description: data.message || t('checkout.trialNowActive'),
      });

      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: t('checkout.trialActivationFailed'),
        description: err.message || t('checkout.couldNotActivateTrial'),
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if already subscribed
  if (subscription?.subscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Check className="h-8 w-8 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">{t('checkout.alreadyProtected')}</h2>
            <p className="text-muted-foreground mb-4">
              {subscription.is_trialing
                ? t('checkout.trialCurrentlyActive')
                : t('checkout.activeSubscription')}
            </p>
            <Button onClick={() => navigate('/dashboard')}>{t('checkout.goToDashboard')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialFeatures = [
    t('checkout.trialFeatureSos'),
    t('checkout.trialFeatureClara'),
    t('checkout.trialFeatureLocation'),
    t('checkout.trialFeatureContact'),
    t('checkout.trialFeatureIncident'),
    t('checkout.trialFeatureFamily'),
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {t('checkout.noCreditCardRequired')}
          </Badge>
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            {t('checkout.startYourFreeTrial')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('checkout.get7DaysAccess')}
          </p>
        </div>

        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('checkout.individualPlan')}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">{t('checkout.sevenDaysFree')}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('checkout.thenPricePerMonth')}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {trialFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleActivateTrial}
              disabled={isActivating}
              size="lg"
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isActivating ? t('checkout.activating') : t('checkout.startSevenDayTrial')}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t('checkout.noPaymentRequired')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrialSignupPage;
