import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Smartphone, QrCode, ArrowRight, Star, Shield } from 'lucide-react';
import Navigation from '@/components/Navigation';
import QRCode from 'qrcode';
import SEO from '@/components/SEO';

const RegistrationSuccess = () => {
  const [iosQR, setIosQR] = useState('');
  const [androidQR, setAndroidQR] = useState('');

  // App Store URLs
  const iosAppStoreUrl = 'https://apps.apple.com/app/lifelink-sync/id123456789';
  const androidPlayStoreUrl = 'https://play.google.com/store/apps/details?id=com.lifelinksync';

  useEffect(() => {
    // Generate QR codes
    const generateQRCodes = async () => {
      try {
        const iosQRData = await QRCode.toDataURL(iosAppStoreUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        const androidQRData = await QRCode.toDataURL(androidPlayStoreUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        
        setIosQR(iosQRData);
        setAndroidQR(androidQRData);
      } catch (error) {
        console.error('Error generating QR codes:', error);
      }
    };

    generateQRCodes();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Welcome to LifeLink Sync – Registration Complete",
    "description": "Your LifeLink Sync registration is complete. Download the app and activate your emergency protection now.",
    "provider": {
      "@type": "Organization",
      "name": "LifeLink Sync",
      "url": "https://lifelink-sync.com"
    },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "LifeLink Sync App",
      "operatingSystem": ["iOS", "Android"],
      "applicationCategory": "HealthApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO 
        title="Welcome to LifeLink Sync – Registration Complete"
        description="Your LifeLink Sync registration is complete. Download the app and activate your emergency protection now. Available on iOS and Android."
        canonical="/welcome"
        structuredData={structuredData}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 mb-8">
            <CardHeader className="text-center py-12 bg-gradient-to-r from-emerald-50 to-primary/5">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="p-4 bg-emerald-100 rounded-full">
                    <CheckCircle className="h-16 w-16 text-emerald-600" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Star className="h-8 w-8 text-yellow-500 fill-current animate-pulse" />
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-4xl font-bold text-foreground mb-4">
                🎉 Welcome to the LifeLink Sync Family!
              </CardTitle>
              
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                Your registration is complete! Clara has successfully set up your personalized safety profile. 
                You're now protected by our advanced emergency response system.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 px-4 py-2">
                  <Shield className="h-4 w-4 mr-2" />
                  Account Activated
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2">
                  Payment Processed
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-4 py-2">
                  Profile Complete
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Download Section */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                <Smartphone className="h-8 w-8 text-primary" />
                Download Your LifeLink Sync App
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Get instant access to your emergency protection system
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* iOS Download */}
                <div className="text-center space-y-6">
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 hover:border-primary/30 transition-colors">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                        📱 iOS (iPhone/iPad)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Requires iOS 14.0 or later
                      </p>
                    </div>
                    
                    {iosQR && (
                      <div className="mb-6">
                        <img 
                          src={iosQR} 
                          alt="iOS App Store QR Code"
                          className="mx-auto rounded-lg shadow-md"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Scan with your iPhone camera
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      asChild 
                      className="w-full bg-black hover:bg-black/90 text-white py-3"
                    >
                      <a href={iosAppStoreUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download from App Store
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Android Download */}
                <div className="text-center space-y-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 hover:border-primary/30 transition-colors">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                        🤖 Android
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Requires Android 8.0 or later
                      </p>
                    </div>
                    
                    {androidQR && (
                      <div className="mb-6">
                        <img 
                          src={androidQR} 
                          alt="Google Play Store QR Code"
                          className="mx-auto rounded-lg shadow-md"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Scan with your Android camera
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      asChild 
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      <a href={androidPlayStoreUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Get it on Google Play
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alternative Download Methods */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-center mb-4 flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Can't scan QR codes?
                </h4>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <a href={`sms:?body=Download LifeLink Sync: ${iosAppStoreUrl}`}>
                      📲 Text iOS link to phone
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`sms:?body=Download LifeLink Sync: ${androidPlayStoreUrl}`}>
                      📲 Text Android link to phone
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                What Happens Next?
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Download & Install</h3>
                  <p className="text-sm text-muted-foreground">
                    Install the app on your device and sign in with your registered email
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-emerald-5 to-emerald-10 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-emerald-600">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Setup Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile is ready! Test the emergency features in safe mode
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-orange-5 to-orange-10 rounded-xl">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-orange-600">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Stay Protected</h3>
                  <p className="text-sm text-muted-foreground">
                    You're now protected 24/7 by our advanced emergency system
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link to="/member-dashboard">
                    Access Your Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <div className="text-center mt-8 p-6 bg-white/80 rounded-xl">
            <p className="text-muted-foreground mb-2">
              Need help? Our support team is available 24/7
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="mailto:support@lifelink-sync.com" className="text-primary hover:underline">
                📧 support@lifelink-sync.com
              </a>
              <a href="tel:+44123456789" className="text-primary hover:underline">
                📞 +44 123 456 789
              </a>
              <a href="/help" className="text-primary hover:underline">
                💬 Live Chat
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;