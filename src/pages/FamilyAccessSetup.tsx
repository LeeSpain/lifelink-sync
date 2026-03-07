import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, AlertCircle, Users } from "lucide-react";
import SetupFamilyProducts from "@/components/dashboard/family/SetupFamilyProducts";
import TestFamilySOSSystem from "@/components/dashboard/family/TestFamilySOSSystem";

const FamilyAccessSetupPage = () => {
  const navigate = useNavigate();
  const [setupStage, setSetupStage] = useState<'initial' | 'products' | 'testing' | 'complete'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const runStripeSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-family-stripe-products');

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSetupStage('products');
      toast({
        title: "Stripe Products Created",
        description: "Family Access products are now available in your Stripe dashboard!"
      });

    } catch (error) {
      console.error('Error setting up Stripe products:', error);
      toast({
        title: "Setup Error",
        description: error instanceof Error ? error.message : "Failed to set up Stripe products",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testInviteFlow = async () => {
    setIsLoading(true);
    try {
      // Test creating a family invite
      const { data, error } = await supabase.functions.invoke('family-invite-management', {
        body: {
          action: 'create',
          name: 'Test Family Member',
          email: 'test@example.com',
          billing_type: 'owner'
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTestResults({
        inviteCreated: true,
        inviteToken: data.invite.token,
        inviteLink: data.invite.link
      });

      setSetupStage('testing');
      toast({
        title: "Invite Test Successful",
        description: "Family invitation system is working correctly!"
      });

    } catch (error) {
      console.error('Error testing invite flow:', error);
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Failed to test invite flow",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = () => {
    setSetupStage('complete');
    toast({
      title: "Setup Complete",
      description: "Family Access system is fully operational!"
    });
  };

  const getStageStatus = (stage: string) => {
    const currentStages = ['initial', 'products', 'testing', 'complete'];
    const currentIndex = currentStages.indexOf(setupStage);
    const stageIndex = currentStages.indexOf(stage);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Complete</Badge>;
      case 'active':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Active</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Family Access System Setup
          </CardTitle>
          <p className="text-muted-foreground">
            Complete setup and testing of the comprehensive Family Access system
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Setup Progress */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <Package className="h-8 w-8 text-primary" />
                <span className="font-medium">Stripe Products</span>
                {getStatusBadge(getStageStatus('products'))}
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <Users className="h-8 w-8 text-primary" />
                <span className="font-medium">Invite System</span>
                {getStatusBadge(getStageStatus('testing'))}
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <AlertCircle className="h-8 w-8 text-primary" />
                <span className="font-medium">SOS System</span>
                {getStatusBadge(getStageStatus('complete'))}
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-primary" />
                <span className="font-medium">Real-time</span>
                {getStatusBadge(getStageStatus('complete'))}
              </div>
            </div>

            {/* Setup Actions */}
            <div className="space-y-4">
              {setupStage === 'initial' && (
                <div className="bg-blue-50 p-4 rounded-lg border-blue-200 border">
                  <h4 className="font-medium mb-2">Step 1: Setup Stripe Products</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create the Family Access subscription products (€2.99/month per seat) in your Stripe account.
                  </p>
                  <Button onClick={runStripeSetup} disabled={isLoading}>
                    {isLoading ? "Setting up..." : "Create Stripe Products"}
                  </Button>
                </div>
              )}

              {setupStage === 'products' && (
                <div className="bg-green-50 p-4 rounded-lg border-green-200 border">
                  <h4 className="font-medium mb-2">Step 2: Test Family Invitation Flow</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test the family invitation system to ensure it's working correctly.
                  </p>
                  <Button onClick={testInviteFlow} disabled={isLoading}>
                    {isLoading ? "Testing..." : "Test Invite System"}
                  </Button>
                </div>
              )}

              {setupStage === 'testing' && testResults && (
                <div className="bg-yellow-50 p-4 rounded-lg border-yellow-200 border">
                  <h4 className="font-medium mb-2">Step 3: Review Test Results</h4>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Family invite created successfully</span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <p className="font-mono text-xs break-all">
                        Invite Token: {testResults.inviteToken}
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <p className="font-mono text-xs break-all">
                        Invite Link: {testResults.inviteLink}
                      </p>
                    </div>
                  </div>
                  <Button onClick={completeSetup}>
                    Complete Setup
                  </Button>
                </div>
              )}

              {setupStage === 'complete' && (
                <div className="bg-green-50 p-4 rounded-lg border-green-200 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium">Setup Complete!</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Family Access system is fully operational. You can now:
                  </p>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• Create family invites with owner-paid or invitee-paid billing</li>
                    <li>• Manage emergency contacts (call-only vs family access)</li>
                    <li>• Send SOS alerts to family members with live maps</li>
                    <li>• Receive "Received & On It" acknowledgments</li>
                    <li>• Privacy-first: location only during active SOS</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/member-dashboard/emergency')}>
                      Go to Emergency Contacts
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/member-dashboard')}>
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test System */}
      <TestFamilySOSSystem />

      {/* Additional Setup Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Features Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Emergency Contacts (Call-only)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Up to 5 contacts included</li>
                <li>• Sequential dialing during SOS</li>
                <li>• No alerts, no login required</li>
                <li>• Phone numbers only</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Family Access (€2.99/month)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Live SOS alerts and maps</li>
                <li>• "Received & On It" acknowledgments</li>
                <li>• Incident summaries and PDFs</li>
                <li>• Privacy-focused (location only during SOS)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyAccessSetupPage;