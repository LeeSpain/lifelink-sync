import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Shield, Smartphone, UserCircle } from 'lucide-react';
import { PageSEO } from '@/components/PageSEO';


interface WelcomeData {
  firstName: string;
  lastName: string;
  email: string;
  subscriptionPlans: any[];
  products: any[];
  regionalServices: any[];
  totalAmount: number;
}

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);

  // Native apps not yet published — show "Coming Soon" instead of fake URLs
  const appsComingSoon = true;

  useEffect(() => {
    const initializeWelcomePage = async () => {
      if (!user) {
        navigate('/dashboard');
        return;
      }

      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Profile data:', profile, 'Error:', profileError);

        // Get user's active subscriptions from subscribers table
        const { data: subscription, error: subError } = await supabase
          .from('subscribers')
          .select('subscription_tier, subscription_end')
          .eq('user_id', user.id)
          .eq('subscribed', true)
          .maybeSingle();

        console.log('Subscription data:', subscription, 'Error:', subError);

        // Get subscription plan details
        const subscriptionPlans = [];
        if (subscription?.subscription_tier) {
          const { data: planData, error: planError } = await supabase
            .from('subscription_plans')
            .select('id, name, price, billing_interval')
            .eq('name', subscription.subscription_tier)
            .maybeSingle();
          
          console.log('Plan data for', subscription.subscription_tier, ':', planData, 'Error:', planError);
          
          if (planData) {
            subscriptionPlans.push(planData);
          }
        }

        // Create updated welcome data
        const welcomeDataFromDB: WelcomeData = {
          firstName: profile?.first_name || user.user_metadata?.first_name || 'User',
          lastName: profile?.last_name || user.user_metadata?.last_name || '',
          email: user.email || '',
          subscriptionPlans,
          products: [], // For now, empty - would need to fetch if there are product purchases
          regionalServices: [], // For now, empty - would need to fetch if there are regional services
          totalAmount: subscriptionPlans.reduce((sum, plan) => sum + (Number(plan.price) || 0), 0)
        };

        console.log('Final welcome data:', welcomeDataFromDB);
        setWelcomeData(welcomeDataFromDB);

        // Clear any old session storage data
        sessionStorage.removeItem('welcomeData');

      } catch (error) {
        console.error('Error fetching welcome data:', error);
        // Fallback to stored data or redirect
        const storedData = sessionStorage.getItem('welcomeData');
        if (storedData) {
          const data = JSON.parse(storedData);
          setWelcomeData(data);
          sessionStorage.removeItem('welcomeData');
        } else {
          navigate('/dashboard');
        }
      }
    };

    initializeWelcomePage();
  }, [user, navigate]);

  if (!welcomeData || !user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t('checkout.loadingWelcomePage')}</p>
        </div>
      </div>
    );
  }

  // Calculate totals to match the payment form
  const PRODUCT_IVA_RATE = 0.21; // 21% for products
  const SERVICE_IVA_RATE = 0.10; // 10% for regional services

  console.log('Calculating totals with welcome data:', welcomeData);

  const subscriptionTotal = (welcomeData?.subscriptionPlans || []).reduce((sum, plan) => {
    const price = plan?.price;
    const monthlyPrice = price ? Number(price) : 0;
    console.log('Processing plan:', plan, 'Monthly price:', monthlyPrice);
    return sum + monthlyPrice;
  }, 0) + (welcomeData?.regionalServices || []).reduce((sum, service) => {
    const price = service?.price;
    const servicePrice = price ? Number(price) : 0;
    const totalServicePrice = servicePrice * (1 + SERVICE_IVA_RATE);
    console.log('Processing service:', service, 'Service price with IVA:', totalServicePrice);
    return sum + totalServicePrice;
  }, 0);

  const productTotal = (welcomeData?.products || []).reduce((sum, product) => {
    const price = product?.price;
    const productPrice = price ? Number(price) : 0;
    const totalProductPrice = productPrice * (1 + PRODUCT_IVA_RATE);
    console.log('Processing product:', product, 'Product price with IVA:', totalProductPrice);
    return sum + totalProductPrice;
  }, 0);

  const grandTotal = subscriptionTotal + productTotal;
  
  console.log('Final totals:', { subscriptionTotal, productTotal, grandTotal });

  const handleDashboardAccess = () => {
    navigate('/dashboard');
  };


  return (
    <div className="min-h-screen bg-gradient-hero">
      <PageSEO pageType="payment-success" />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-page-top pb-section">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircle className="w-20 h-20 text-primary" />
                <div className="absolute inset-0 animate-ping">
                  <CheckCircle className="w-20 h-20 text-primary opacity-30" />
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              {t('checkout.welcomeName', { name: welcomeData.firstName })}
            </h1>

            <p className="text-xl text-white/90 mb-2">
              {t('checkout.protectionNowActive')}
            </p>

            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-lg">
              <Shield className="w-5 h-5 mr-2" />
              {t('checkout.accountActivatedSuccessfully')}
            </Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Purchase Summary Card */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  {t('checkout.purchaseConfirmation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{t('checkout.customerInformation')}</h4>
                  <div className="text-sm space-y-1 text-foreground">
                    <p><strong>{t('checkout.name')}:</strong> {welcomeData.firstName} {welcomeData.lastName}</p>
                    <p><strong>{t('checkout.email')}:</strong> {welcomeData.email}</p>
                  </div>
                </div>

                {/* Monthly Subscriptions */}
                {(welcomeData.subscriptionPlans?.length ?? 0) > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">{t('checkout.monthlySubscriptions')}</h5>
                    <ul className="space-y-2">
                      {welcomeData.subscriptionPlans.map(plan => (
                        <li key={plan.id} className="flex justify-between p-2 bg-secondary rounded border">
                          <span className="font-medium text-foreground">{plan.name}</span>
                          <span className="text-foreground">€{(plan?.price != null ? Number(plan.price) : 0).toFixed(2)}/{t('checkout.month')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Regional Services */}
                {(welcomeData.regionalServices?.length ?? 0) > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">{t('checkout.regionalServices')}</h5>
                    <ul className="space-y-2">
                      {welcomeData.regionalServices.map(service => {
                        const netPrice = service?.price != null ? Number(service.price) : 0;
                        const totalPrice = netPrice * (1 + SERVICE_IVA_RATE);
                        return (
                          <li key={service.id} className="p-2 bg-secondary rounded border">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-foreground">{service.name} ({service.region})</span>
                              <span className="font-bold text-foreground">€{totalPrice.toFixed(2)}/{t('checkout.month')}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Safety Products */}
                {(welcomeData.products?.length ?? 0) > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">{t('checkout.safetyProductsOneTime')}</h5>
                    <ul className="space-y-2">
                      {welcomeData.products.map(product => {
                        const netPrice = product?.price != null ? Number(product.price) : 0;
                        const totalPrice = netPrice * (1 + PRODUCT_IVA_RATE);
                        return (
                          <li key={product.id} className="p-2 bg-secondary rounded border">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-foreground">{product.name}</span>
                              <span className="font-bold text-foreground">€{totalPrice.toFixed(2)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Total Summary */}
                <div className="border-t pt-4 space-y-2">
                  {subscriptionTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('checkout.monthlySubscription')}:</span>
                      <span className="font-medium text-foreground">€{subscriptionTotal.toFixed(2)}/{t('checkout.month')}</span>
                    </div>
                  )}
                  {productTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('checkout.oneTimeProducts')}:</span>
                      <span className="font-medium text-foreground">€{productTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="text-foreground">{t('checkout.totalPayment')}:</span>
                    <span className="text-primary">€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Card */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <UserCircle className="w-6 h-6 text-primary" />
                  {t('checkout.whatsNext')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dashboard Access */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('checkout.accessYourDashboard')}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('checkout.completeProfileEmergency')}
                      </p>
                      <Button 
                        onClick={handleDashboardAccess}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        size="lg"
                      >
                        <UserCircle className="w-5 h-5 mr-2" />
                        {t('checkout.openYourDashboard')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile App Download */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">2</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{t('checkout.downloadMobileApp')}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('checkout.getInstantAccessEmergency')}
                      </p>
                      
                      {/* Native apps coming soon */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-4 rounded-lg border bg-muted/50">
                          <Smartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs font-medium">{t('checkout.iosAppStore')}</p>
                          <Badge variant="secondary" className="mt-1">{t('checkout.comingSoon')}</Badge>
                        </div>
                        <div className="text-center p-4 rounded-lg border bg-muted/50">
                          <Smartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs font-medium">{t('checkout.googlePlay')}</p>
                          <Badge variant="secondary" className="mt-1">{t('checkout.comingSoon')}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Information */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">{t('checkout.needHelp')}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>{t('checkout.email')}:</strong> support@lifelink-sync.com</p>
                    <p><strong>{t('checkout.liveChat')}:</strong> {t('checkout.available247')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm">
              {t('checkout.subscriptionBeginsImmediately')}
              <br />
              {t('checkout.supportAvailable247')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;