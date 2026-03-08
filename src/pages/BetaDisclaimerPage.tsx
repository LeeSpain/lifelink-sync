import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Phone, Globe, Shield, Users } from "lucide-react";

export default function BetaDisclaimerPage() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleAccept = () => {
    if (!agreed) {
      toast({
        title: t('beta.agreementRequired'),
        description: t('beta.agreementRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('beta_disclaimer_accepted', 'true');
    toast({
      title: t('beta.welcomeTitle'),
      description: t('beta.welcomeDesc'),
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-lg px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('beta.badge')}
          </Badge>
          <h1 className="text-4xl font-bold">{t('beta.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('beta.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                {t('beta.whatsWorking')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('beta.securityTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('beta.securityDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('beta.userManagementTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('beta.userManagementDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('beta.locationTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('beta.locationDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                {t('beta.limitations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('beta.emergencyServicesTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('beta.emergencyServicesDesc')}</p>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  {t('beta.emergencyWarning')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('beta.termsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{t('beta.benefitsTitle')}</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>{t('beta.benefit1')}</li>
                <li>{t('beta.benefit2')}</li>
                <li>{t('beta.benefit3')}</li>
                <li>{t('beta.benefit4')}</li>
              </ul>
            </div>

            <div className="space-y-3 text-sm">
              <p><strong>{t('beta.emergencyIntegrationLabel')}</strong> {t('beta.emergencyIntegrationText')}</p>

              <p><strong>{t('beta.dataCollectionLabel')}</strong> {t('beta.dataCollectionText')}</p>

              <p><strong>{t('beta.serviceAvailabilityLabel')}</strong> {t('beta.serviceAvailabilityText')}</p>

              <p><strong>{t('beta.feedbackLabel')}</strong> {t('beta.feedbackText')}</p>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="beta-agreement"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <label htmlFor="beta-agreement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('beta.agreementLabel')}
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                {t('beta.goBack')}
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!agreed}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {t('beta.joinBeta')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}