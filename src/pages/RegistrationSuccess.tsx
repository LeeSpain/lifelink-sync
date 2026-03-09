import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Smartphone, QrCode, ArrowRight, Shield, Share2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import QRCode from 'qrcode';
import SEO from '@/components/SEO';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';

const RegistrationSuccess = () => {
  const { t } = useTranslation();
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();
  const [webAppQR, setWebAppQR] = useState('');

  const webAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.vercel.app';

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = await QRCode.toDataURL(webAppUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setWebAppQR(qrData);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    generateQR();
  }, [webAppUrl]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Welcome to LifeLink Sync – Registration Complete",
    "description": "Your LifeLink Sync registration is complete. Install the app and activate your emergency protection now.",
    "provider": {
      "@type": "Organization",
      "name": "LifeLink Sync",
      "url": "https://lifelink-sync.com"
    },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "LifeLink Sync",
      "applicationCategory": "WebApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO
        title="Welcome to LifeLink Sync – Registration Complete"
        description="Your LifeLink Sync registration is complete. Install the app to your home screen and activate your emergency protection now."
        canonical="/welcome"
        structuredData={structuredData}
      />
      <Navigation />

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <Card className="border rounded-lg shadow-sm mb-8">
            <CardHeader className="text-center py-12 bg-muted/50">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <CheckCircle className="h-16 w-16 text-primary" />
                </div>
              </div>

              <CardTitle className="text-2xl font-bold text-foreground mb-4">
                {t('checkout.welcomeToFamily')}
              </CardTitle>

              <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t('checkout.registrationComplete')}
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('checkout.accountActivated')}
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  {t('checkout.paymentProcessed')}
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  {t('checkout.profileComplete')}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Install Section */}
          <Card className="border rounded-lg shadow-sm mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                {t('checkout.downloadYourApp')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('checkout.getInstantAccessProtection')}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Install Status */}
              {isInstalled ? (
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('checkout.alreadyInstalled')}
                  </Badge>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  {isInstallable && (
                    <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('checkout.installPwaDesc')}
                      </p>
                      <Button size="lg" onClick={installApp} className="px-10">
                        <Download className="h-4 w-4 mr-2" />
                        {t('checkout.installPwa')}
                      </Button>
                    </div>
                  )}

                  {/* Manual Install Instructions */}
                  <div className="p-6 rounded-lg bg-muted/50 border">
                    <h4 className="text-sm font-semibold mb-3 flex items-center justify-center gap-2">
                      <Share2 className="h-4 w-4" />
                      {t('checkout.manualInstallTitle')}
                    </h4>
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">1.</span>{' '}
                        {t('checkout.iosInstructions')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">2.</span>{' '}
                        {t('checkout.androidInstructions')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">3.</span>{' '}
                        {t('checkout.desktopInstructions')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code + SMS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {webAppQR && (
                  <div className="text-center p-4 rounded-lg border">
                    <QrCode className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <img
                      src={webAppQR}
                      alt="LifeLink Sync QR Code"
                      className="mx-auto rounded-lg shadow-sm"
                      loading="lazy"
                      decoding="async"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('checkout.scanToOpen')}
                    </p>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border">
                  <Smartphone className="h-5 w-5 mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mb-3 text-center">
                    {t('checkout.scanToOpen')}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`sms:?body=${encodeURIComponent(`LifeLink Sync: ${webAppUrl}`)}`}>
                      {t('checkout.textLinkToPhone')}
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                {t('checkout.whatHappensNext')}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-primary/5 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{t('checkout.saveToHomeScreen')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('checkout.saveToHomeScreenDesc')}
                  </p>
                </div>

                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-sm font-bold text-foreground">2</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{t('checkout.setupComplete')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('checkout.profileReadyTestFeatures')}
                  </p>
                </div>

                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-sm font-bold text-foreground">3</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{t('checkout.stayProtected')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('checkout.nowProtected247')}
                  </p>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button asChild size="lg">
                  <Link to="/member-dashboard">
                    {t('checkout.accessYourDashboard')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <div className="text-center mt-8 p-6 bg-background/80 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              {t('checkout.needHelpSupport247')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="mailto:support@lifelink-sync.com" className="text-primary hover:underline">
                support@lifelink-sync.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
