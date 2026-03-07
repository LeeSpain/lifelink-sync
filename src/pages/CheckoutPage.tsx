import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { PageSEO } from '@/components/PageSEO';

const CheckoutPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>('');

  const planId = searchParams.get('plan');

  useEffect(() => {
    const initiateCheckout = async () => {
      if (authLoading) return;
      
      if (!user) {
        // Redirect to auth with return URL
        navigate(`/auth?next=/checkout&plan=${planId || ''}`);
        return;
      }

      if (!planId) {
        setError('No plan selected. Please choose a plan from the pricing page.');
        setIsProcessing(false);
        return;
      }

      try {
        // First, get plan details for display
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', planId)
          .maybeSingle();
        
        if (planData?.name) {
          setPlanName(planData.name);
        }

        // Call create-checkout edge function
        const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
          body: { plans: [planId] }
        });

        if (fnError) {
          console.error('Checkout error:', fnError);
          throw new Error(fnError.message || 'Failed to create checkout session');
        }

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        setError(err.message || 'Failed to initiate checkout. Please try again.');
        setIsProcessing(false);
      }
    };

    initiateCheckout();
  }, [user, authLoading, planId, navigate]);

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while processing checkout
  if (isProcessing && !error) {
    return (
      <>
        <PageSEO pageType="register" />
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-xl">Preparing Checkout</CardTitle>
              <CardDescription>
                {planName ? `Setting up ${planName}...` : 'Setting up your subscription...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Redirecting to secure payment...
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show error state with retry
  return (
    <>
      <PageSEO pageType="register" />
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Checkout Error</CardTitle>
            <CardDescription>
              We couldn't start the checkout process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  setError(null);
                  setIsProcessing(true);
                  window.location.reload();
                }}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                asChild
                className="w-full"
              >
                <Link to="/#pricing">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pricing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CheckoutPage;
