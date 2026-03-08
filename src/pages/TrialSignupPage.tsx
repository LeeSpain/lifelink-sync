import React, { useState } from 'react';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: subscription } = useOptimizedSubscription();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateTrial = async () => {
    if (!user) {
      navigate('/register');
      return;
    }

    setIsActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('activate-trial');

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Trial Activated!',
        description: data.message || 'Your 7-day free trial is now active.',
      });

      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Trial Activation Failed',
        description: err.message || 'Could not activate your trial. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Redirect if already subscribed
  if (subscription?.subscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold mb-2">You're Already Protected</h2>
            <p className="text-muted-foreground mb-4">
              {subscription.is_trialing
                ? 'Your free trial is currently active.'
                : 'You have an active subscription.'}
            </p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialFeatures = [
    'SOS activation (app)',
    'Clara AI 24/7',
    'Live location sharing',
    '1 emergency contact',
    'Incident log',
    '1 free Family Link',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            No Credit Card Required
          </Badge>
          <h1 className="text-3xl font-bold font-poppins mb-2 text-[hsl(215,25%,27%)]">
            Start Your Free Trial
          </h1>
          <p className="text-gray-600">
            Get 7 days of full access to LifeLink Sync protection features.
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Individual Plan
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">7 days free</span>
                </div>
                <p className="text-xs text-muted-foreground">then &euro;9.99/month</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {trialFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleActivateTrial}
              disabled={isActivating || !user}
              className="w-full py-6 font-semibold text-lg"
            >
              <Shield className="h-5 w-5 mr-2" />
              {isActivating ? 'Activating...' : 'Start 7-Day Free Trial'}
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
                  Create an account
                </Button>
                {' '}first to start your trial.
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              No payment required. Cancel anytime. After 7 days, subscribe for &euro;9.99/month to continue.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrialSignupPage;
