import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FamilyCheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processSuccessfulPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Error",
          description: "No payment session found",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      try {
        // Process the payment and update memberships
        const { data, error } = await supabase.functions.invoke('process-family-payment', {
          body: { session_id: sessionId }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setInviteDetails(data);
        
        toast({
          title: "Payment Successful!",
          description: "Your family access has been activated. All dashboards will be updated shortly.",
        });
      } catch (error) {
        console.error('Error processing payment:', error);
        toast({
          title: "Processing Error",
          description: "Payment was successful but there was an issue updating your account. Please contact support.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processSuccessfulPayment();
  }, [sessionId, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Welcome to Family Access! Your subscription is now active.
            </p>
            {inviteDetails?.family_member_name && (
              <p className="font-medium">
                You've joined {inviteDetails.family_member_name}'s family group.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Family SOS Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive emergency alerts from family members
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Live Emergency Map</p>
                <p className="text-sm text-muted-foreground">
                  See real-time location during SOS events
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/family-dashboard')} 
              className="w-full"
            >
              View Family Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyCheckoutSuccess;