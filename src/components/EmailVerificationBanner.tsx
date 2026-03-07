import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Don't show banner if no user or email is already confirmed
  if (!user || user.email_confirmed_at) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
        options: {
          emailRedirectTo: `${window.location.origin}/sos-app`
        }
      });

      if (error) {
        toast.error(`Failed to resend verification email: ${error.message}`);
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-amber-800">
            Please verify your email address to access all features. Check your inbox for a confirmation link.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendEmail}
          disabled={isResending}
          className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          {isResending ? 'Sending...' : 'Resend Email'}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default EmailVerificationBanner;