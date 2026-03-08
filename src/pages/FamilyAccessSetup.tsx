import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, AlertCircle, Users } from "lucide-react";
import SetupFamilyProducts from "@/components/dashboard/family/SetupFamilyProducts";
import TestFamilySOSSystem from "@/components/dashboard/family/TestFamilySOSSystem";

const FamilyAccessSetupPage = () => {
  const { t } = useTranslation();
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
        title: t('family.stripeProductsCreatedTitle'),
        description: t('family.stripeProductsCreatedDescription')
      });

    } catch (error) {
      console.error('Error setting up Stripe products:', error);
      toast({
        title: t('family.setupErrorTitle'),
        description: error instanceof Error ? error.message : t('family.setupErrorTitle'),
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
        title: t('family.inviteTestSuccessTitle'),
        description: t('family.inviteTestSuccessDescription')
      });

    } catch (error) {
      console.error('Error testing invite flow:', error);
      toast({
        title: t('family.testErrorTitle'),
        description: error instanceof Error ? error.message : t('family.testErrorTitle'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = () => {
    setSetupStage('complete');
    toast({
      title: t('family.setupCompleteToastTitle'),
      description: t('family.setupCompleteToastDescription')
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
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />{t('family.complete')}</Badge>;
      case 'active':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />{t('family.active')}</Badge>;
      case 'pending':
        return <Badge variant="outline">{t('family.pending')}</Badge>;
      default:
        return <Badge variant="outline">{t('family.pending')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t('family.setupTitle')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('family.setupDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Setup Progress */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <Package className="h-8 w-8 text-primary" />
                <span className="font-medium">{t('family.stripeProducts')}</span>
                {getStatusBadge(getStageStatus('products'))}
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <Users className="h-8 w-8 text-primary" />
                <span className="font-medium">{t('family.inviteSystem')}</span>
                {getStatusBadge(getStageStatus('testing'))}
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <AlertCircle className="h-8 w-8 text-primary" />
                <span className="font-medium">{t('family.sosSystem')}</span>
                {getStatusBadge(getStageStatus('complete'))}
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-primary" />
                <span className="font-medium">{t('family.realTime')}</span>
                {getStatusBadge(getStageStatus('complete'))}
              </div>
            </div>

            {/* Setup Actions */}
            <div className="space-y-4">
              {setupStage === 'initial' && (
                <div className="bg-blue-50 p-4 rounded-lg border-blue-200 border">
                  <h4 className="font-medium mb-2">{t('family.step1Title')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('family.step1Description')}
                  </p>
                  <Button onClick={runStripeSetup} disabled={isLoading}>
                    {isLoading ? t('family.settingUp') : t('family.createStripeProducts')}
                  </Button>
                </div>
              )}

              {setupStage === 'products' && (
                <div className="bg-green-50 p-4 rounded-lg border-green-200 border">
                  <h4 className="font-medium mb-2">{t('family.step2Title')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('family.step2Description')}
                  </p>
                  <Button onClick={testInviteFlow} disabled={isLoading}>
                    {isLoading ? t('family.testing') : t('family.testInviteSystem')}
                  </Button>
                </div>
              )}

              {setupStage === 'testing' && testResults && (
                <div className="bg-yellow-50 p-4 rounded-lg border-yellow-200 border">
                  <h4 className="font-medium mb-2">{t('family.step3Title')}</h4>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{t('family.inviteCreatedSuccess')}</span>
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
                    {t('family.completeSetup')}
                  </Button>
                </div>
              )}

              {setupStage === 'complete' && (
                <div className="bg-green-50 p-4 rounded-lg border-green-200 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium">{t('family.setupCompleteTitle')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('family.setupCompleteDescription')}
                  </p>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• {t('family.setupFeature1')}</li>
                    <li>• {t('family.setupFeature2')}</li>
                    <li>• {t('family.setupFeature3')}</li>
                    <li>• {t('family.setupFeature4')}</li>
                    <li>• {t('family.setupFeature5')}</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/member-dashboard/emergency')}>
                      {t('family.goToEmergencyContacts')}
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/member-dashboard')}>
                      {t('family.backToDashboard')}
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
          <CardTitle>{t('family.systemFeaturesOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">{t('family.callOnlyContacts')}</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('family.callOnlyFeature1')}</li>
                <li>• {t('family.callOnlyFeature2')}</li>
                <li>• {t('family.callOnlyFeature3')}</li>
                <li>• {t('family.callOnlyFeature4')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">{t('family.familyAccessPricing')}</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('family.familyAccessFeature1')}</li>
                <li>• {t('family.familyAccessFeature2')}</li>
                <li>• {t('family.familyAccessFeature3')}</li>
                <li>• {t('family.familyAccessFeature4')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyAccessSetupPage;