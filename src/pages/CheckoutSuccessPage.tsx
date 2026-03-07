import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageSEO } from '@/components/PageSEO';

const CheckoutSuccessPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isVerifying, setIsVerifying] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      if (!sessionId) {
        toast({
          title: "Payment Error",
          description: "No session found. Please contact support if you were charged.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        // Verify the session via edge function (optional - for additional verification)
        // The webhook should have already processed the payment
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Verification error:', error);
        }

        // Show success toast
        toast({
          title: "Payment Successful! 🎉",
          description: "Welcome to LifeLink Sync! Let's complete your setup.",
        });

        // Short delay to show success state, then redirect to onboarding
        setTimeout(() => {
          navigate('/dashboard/onboarding');
        }, 1500);

      } catch (err) {
        console.error('Payment verification error:', err);
        // Even if verification fails, redirect to onboarding
        // The webhook should have processed the payment
        toast({
          title: "Welcome!",
          description: "Your account is being set up. Let's complete your profile.",
        });
        navigate('/dashboard/onboarding');
      }
    };

    verifyPayment();
  }, [user, authLoading, sessionId, navigate, toast]);

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO pageType="payment-success" />
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-700">Payment Successful!</CardTitle>
            <CardDescription>
              Your subscription is now active
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isVerifying && (
              <>
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Setting up your account...
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CheckoutSuccessPage;
