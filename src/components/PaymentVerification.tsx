import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentVerificationProps {
  sessionId?: string;
  onVerificationComplete: (success: boolean) => void;
}

export const PaymentVerification = ({ sessionId, onVerificationComplete }: PaymentVerificationProps) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [details, setDetails] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      setDetails('No payment session found');
      onVerificationComplete(false);
      return;
    }

    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setStatus('loading');
      
      // Check subscription status after payment
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }

      if (data.subscribed) {
        setStatus('success');
        setDetails(`Successfully subscribed to ${data.subscription_tier} plan`);
        onVerificationComplete(true);
        
        toast({
          title: "Payment Successful!",
          description: `Your ${data.subscription_tier} subscription is now active.`,
        });
      } else {
        setStatus('failed');
        setDetails('Payment verification failed');
        onVerificationComplete(false);
        
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if payment was processed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setDetails(error instanceof Error ? error.message : 'Unknown error');
      onVerificationComplete(false);
      
      toast({
        title: "Verification Error",
        description: "Could not verify payment status. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const retryVerification = () => {
    verifyPayment();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status === 'failed' && <XCircle className="w-5 h-5 text-destructive" />}
          
          {status === 'loading' && 'Verifying Payment...'}
          {status === 'success' && 'Payment Confirmed'}
          {status === 'failed' && 'Verification Failed'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{details}</p>
        
        {status === 'failed' && (
          <div className="space-y-2">
            <Button onClick={retryVerification} variant="outline" className="w-full">
              Retry Verification
            </Button>
            <Button 
              onClick={() => navigate('/contact')} 
              variant="ghost" 
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        )}
        
        {status === 'success' && (
          <Button 
            onClick={() => navigate('/member-dashboard')} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentVerification;