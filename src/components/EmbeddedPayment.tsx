import { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { convertCurrency, formatDisplayCurrency, languageToLocale } from '@/utils/currency';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { SupportedCurrency } from '@/contexts/PreferencesContext';

// Dynamic Stripe initialization - fetches the correct publishable key from backend
const getStripeConfig = async () => {
  try {
    console.log("🔑 Fetching Stripe configuration...");
    const { data, error } = await supabase.functions.invoke('get-stripe-config');
    
    if (error) {
      console.error('❌ Failed to get Stripe config:', error);
      throw new Error('Payment configuration error');
    }
    
    if (!data?.publishableKey) {
      console.error('❌ No publishable key received from config');
      throw new Error('Payment configuration incomplete');
    }
    
    console.log('✅ Stripe config retrieved successfully');
    return data.publishableKey;
  } catch (error) {
    console.error('❌ Error fetching Stripe config:', error);
    throw new Error('Failed to initialize payment system');
  }
};

interface PaymentFormProps {
  clientSecret: string;
  customerId: string;
  plans: string[];
  firstName: string;
  lastName: string;
  userEmail: string;
  country?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm = ({ clientSecret, customerId, plans, firstName, lastName, userEmail, country, onSuccess, onError }: PaymentFormProps) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const { toast } = useToast();

  // Debug logging
  console.log("💳 PaymentForm rendered", { 
    stripe: !!stripe, 
    elements: !!elements, 
    clientSecret: clientSecret?.slice(-10), 
    elementReady 
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment - billing details now collected by PaymentElement
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required"
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Process mixed payment (subscriptions + products)
        const { data, error } = await supabase.functions.invoke('process-mixed-payment', {
          body: {
            payment_intent_id: paymentIntent.id,
            customer_id: customerId
          }
        });

        if (error) throw error;

        toast({
          title: t('payment.paymentSuccessful'),
          description: t('payment.subscriptionAndOrdersActive'),
        });
        
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('payment.paymentFailed');
      toast({
        title: t('payment.paymentFailed'),
        description: errorMessage,
        variant: "destructive"
      });
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // PaymentElement options - allow collection with defaults
  const paymentElementOptions = useMemo(() => ({
    layout: "tabs" as const,
    fields: {
      billingDetails: {
        address: {
          country: "auto" as const,
          postalCode: "auto" as const
        }
      }
    },
    defaultValues: {
      billingDetails: {
        name: `${firstName} ${lastName}`,
        email: userEmail,
        address: {
          country: country || "NL" // Default to Netherlands if no country provided
        }
      }
    }
  }), [firstName, lastName, userEmail, country]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="min-h-[200px] border rounded-lg p-4">
        <PaymentElement 
          options={paymentElementOptions}
          onReady={() => {
            console.log("✅ PaymentElement is ready");
            setElementReady(true);
          }}
          onLoadError={(error) => {
            console.error("❌ PaymentElement load error:", error);
            onError(t('payment.formFailedToLoad'));
          }}
        />
        {!elementReady && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">{t('payment.loadingForm')}</span>
          </div>
        )}
      </div>
      <Button
        type="submit" 
        disabled={!stripe || !elements || isProcessing || !elementReady} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('payment.processingPayment')}
          </>
        ) : (
          t('payment.completePayment')
        )}
      </Button>
    </form>
  );
};

interface EmbeddedPaymentProps {
  plans: string[];
  products?: string[];
  regionalServices?: string[];
  userEmail: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  city?: string;
  country?: string;
  currency?: SupportedCurrency;
  onSuccess: () => void;
  onBack: () => void;
}


const EmbeddedPayment = ({ plans, products = [], regionalServices = [], userEmail, firstName, lastName, password, phone, city, country, currency: propCurrency, onSuccess, onBack }: EmbeddedPaymentProps) => {
  const { t } = useTranslation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currency: contextCurrency, language } = usePreferences();
  const selectedCurrency = propCurrency || contextCurrency;

  // Memoize Stripe options to prevent re-mounting Elements
  const stripeOptions = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorText: 'hsl(var(--foreground))',
          colorDanger: 'hsl(var(--destructive))',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '6px'
        }
      }
    };
  }, [clientSecret]);

  // Fetch data from database for display
  const [planData, setPlanData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  
  
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch subscription plans
      if (plans.length > 0) {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .in('id', plans);
        if (error) throw error;
        setPlanData(data || []);
      }

      // Fetch products
      if (products.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', products);
        if (error) throw error;
        setProductData(data || []);
      } else {
        setProductData([]);
      }

      // Fetch regional services
      if (regionalServices.length > 0) {
        const { data, error } = await supabase
          .from('regional_services')
          .select('*')
          .in('id', regionalServices);
        if (error) throw error;
        setServiceData(data || []);
      } else {
        setServiceData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  fetchData();
}, [plans, products, regionalServices]);

  // Tax rates to match the registration form
  const PRODUCT_IVA_RATE = 0.21; // 21% for products
  const SERVICE_IVA_RATE = 0.10; // 10% for regional services

  const subscriptionTotal = planData.reduce((sum, plan) => {
    const convertedPrice = convertCurrency(parseFloat(plan.price.toString()), 'EUR', selectedCurrency);
    return sum + convertedPrice;
  }, 0) + serviceData.reduce((sum, service) => {
    // Add IVA tax for regional services
    const servicePrice = parseFloat(service.price.toString());
    const convertedPrice = convertCurrency(servicePrice, 'EUR', selectedCurrency);
    return sum + (convertedPrice * (1 + SERVICE_IVA_RATE));
  }, 0);

  const productTotal = productData.reduce((sum, product) => {
    // Add IVA tax for products
    const productPrice = parseFloat(product.price.toString());
    const convertedPrice = convertCurrency(productPrice, 'EUR', selectedCurrency);
    return sum + (convertedPrice * (1 + PRODUCT_IVA_RATE));
  }, 0);

  const grandTotal = subscriptionTotal + productTotal;

const initializePayment = async (retryCount = 0) => {
  console.log("🚀 Initializing payment...", {
    plans,
    products,
    regionalServices,
    userEmail,
    firstName,
    lastName,
    retryCount,
  });
  
  setInitializationError(null);
  
  if ((!plans || plans.length === 0) && (!products || products.length === 0) && (!regionalServices || regionalServices.length === 0)) {
    const errorMsg = "No items provided to payment initialization";
    console.error("❌", errorMsg);
    setInitializationError(errorMsg);
    toast({
      title: t('payment.paymentError'),
      description: t('payment.noItemsSelected'),
      variant: "destructive"
    });
    setLoading(false);
    return;
  }

  // Initialize Stripe for real payments
  try {
    const publishableKey = await getStripeConfig();
    const stripe = loadStripe(publishableKey);
    setStripePromise(stripe);
    console.log("✅ Stripe initialized successfully");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to initialize Stripe";
    console.error("❌", errorMsg);
    setInitializationError(errorMsg);
    toast({
      title: t('payment.configurationError'),
      description: t('payment.systemNotConfigured'),
      variant: "destructive"
    });
    setLoading(false);
    return;
  }
  
  try {
    console.log("📡 Calling create-mixed-payment...");
    const { data, error } = await supabase.functions.invoke('create-mixed-payment', {
      body: { 
        subscriptionPlans: plans, 
        products, 
        regionalServices,
        email: userEmail, 
        firstName, 
        lastName,
        currency: selectedCurrency
      }
    });

    console.log("📦 Payment intent response:", { 
      hasData: !!data, 
      hasError: !!error, 
      clientSecret: data?.client_secret?.slice(-10),
      customerId: data?.customer_id
    });

    if (error) {
      // Check for specific client_secret mismatch error
      if (error.message && error.message.includes('client_secret')) {
        const errorMsg = "Client secret mismatch error - likely Stripe key configuration issue";
        console.error("❌", errorMsg);
        setInitializationError(errorMsg);
        toast({
          title: t('payment.configurationError'),
          description: t('payment.configMismatch'),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      throw error;
    }

    if (!data?.client_secret) {
      throw new Error("No client secret received from payment service");
    }

    // Validate client secret format
    if (!data.client_secret.startsWith('pi_')) {
      throw new Error("Invalid client secret format received");
    }

    console.log("✅ Setting client secret and customer ID");
    setClientSecret(data.client_secret);
    setCustomerId(data.customer_id);
    setInitializationError(null);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Payment initialization error:", errorMsg);
    setInitializationError(errorMsg);
    
    // Retry logic with exponential backoff for network errors
    if (retryCount < 2 && error instanceof Error && 
        (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('fetch'))) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`🔄 Retrying payment initialization in ${delay}ms...`);
      setTimeout(() => initializePayment(retryCount + 1), delay);
      return;
    }
    
    toast({
      title: t('payment.paymentError'),
      description: t('payment.failedToInitialize'),
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

  // Initialize payment on component mount
  useEffect(() => {
    console.log("🎬 EmbeddedPayment mounted/updated, initializing payment...");
    setLoading(true);
    initializePayment();
    
    return () => {
      console.log("🎬 EmbeddedPayment unmounting...");
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
        <h4 className="font-medium">{t('payment.customerInformation')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">{t('payment.name')}:</span> {firstName} {lastName}
          </div>
          <div>
            <span className="font-medium">{t('payment.email')}:</span> {userEmail}
          </div>
          {phone && (
            <div>
              <span className="font-medium">{t('payment.phone')}:</span> {phone}
            </div>
          )}
          {city && country && (
            <div>
              <span className="font-medium">{t('payment.location')}:</span> {city}, {country}
            </div>
          )}
        </div>
      </div>


      {/* Order Summary */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-4">
        <h4 className="font-medium">{t('payment.orderSummary')}</h4>
        
        {/* Subscription Plans */}
        {planData.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">{t('payment.monthlySubscriptions')}</h5>
            <ul className="space-y-2">
              {planData.map(plan => {
                const convertedPrice = convertCurrency(parseFloat(plan.price.toString()), 'EUR', selectedCurrency);
                const formattedPrice = formatDisplayCurrency(convertedPrice, selectedCurrency, languageToLocale(language));
                return (
                  <li key={plan.id} className="flex justify-between p-2 bg-white rounded border">
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-foreground">{formattedPrice}/{t('payment.month')}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Regional Services */}
        {serviceData.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">{t('payment.regionalServices')}</h5>
            <ul className="space-y-2">
              {serviceData.map(service => {
                const netPrice = parseFloat(service.price.toString());
                const convertedNetPrice = convertCurrency(netPrice, 'EUR', selectedCurrency);
                const ivaAmount = convertedNetPrice * SERVICE_IVA_RATE;
                const totalPrice = convertedNetPrice * (1 + SERVICE_IVA_RATE);
                const formattedNetPrice = formatDisplayCurrency(convertedNetPrice, selectedCurrency, languageToLocale(language));
                const formattedIvaAmount = formatDisplayCurrency(ivaAmount, selectedCurrency, languageToLocale(language));
                const formattedTotalPrice = formatDisplayCurrency(totalPrice, selectedCurrency, languageToLocale(language));
                return (
                  <li key={service.id} className="p-2 bg-white rounded border">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{service.name} ({service.region})</span>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">{t('payment.net')}: {formattedNetPrice} + IVA: {formattedIvaAmount}</div>
                        <div className="font-bold text-foreground">{formattedTotalPrice}/{t('payment.month')}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Products */}
        {productData.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">{t('payment.safetyProductsOneTime')}</h5>
            <ul className="space-y-2">
              {productData.map(product => {
                const netPrice = parseFloat(product.price.toString());
                const convertedNetPrice = convertCurrency(netPrice, 'EUR', selectedCurrency);
                const ivaAmount = convertedNetPrice * PRODUCT_IVA_RATE;
                const totalPrice = convertedNetPrice * (1 + PRODUCT_IVA_RATE);
                const formattedNetPrice = formatDisplayCurrency(convertedNetPrice, selectedCurrency, languageToLocale(language));
                const formattedIvaAmount = formatDisplayCurrency(ivaAmount, selectedCurrency, languageToLocale(language));
                const formattedTotalPrice = formatDisplayCurrency(totalPrice, selectedCurrency, languageToLocale(language));
                return (
                  <li key={product.id} className="p-2 bg-white rounded border">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{product.name}</span>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">{t('payment.net')}: {formattedNetPrice} + IVA: {formattedIvaAmount}</div>
                        <div className="font-bold text-foreground">{formattedTotalPrice}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-3 space-y-2">
          {subscriptionTotal > 0 && (
            <div className="flex justify-between text-base">
              <span>{t('payment.monthlySubscription')}:</span>
              <span className="text-foreground">{formatDisplayCurrency(subscriptionTotal, selectedCurrency, languageToLocale(language))}/{t('payment.month')}</span>
            </div>
          )}
          {productTotal > 0 && (
            <div className="flex justify-between text-base">
              <span>{t('payment.oneTimeProducts')}:</span>
              <span className="text-foreground">{formatDisplayCurrency(productTotal, selectedCurrency, languageToLocale(language))}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>{t('payment.totalPayment')}:</span>
            <span className="text-foreground">
              {formatDisplayCurrency(grandTotal, selectedCurrency, languageToLocale(language))}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('payment.paymentDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">{t('payment.loadingForm')}</span>
            </div>
          ) : initializationError ? (
            <div className="text-center p-4 space-y-3">
              <p className="text-destructive font-medium">{t('payment.setupFailed')}</p>
              <p className="text-sm text-muted-foreground">
                {initializationError}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLoading(true);
                  initializePayment();
                }}
                className="bg-background hover:bg-muted"
              >
                <Loader2 className="mr-2 h-4 w-4" />
                {t('payment.retrySetup')}
              </Button>
            </div>
          ) : clientSecret && stripeOptions ? (
            <div className="space-y-4">
              
              <div className="text-sm text-muted-foreground text-center">
                {t('payment.securePayment')}
              </div>
              <Elements 
                stripe={stripePromise} 
                options={stripeOptions}
                key={clientSecret} // Force re-mount if clientSecret changes
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  customerId={customerId}
                  plans={plans}
                  firstName={firstName}
                  lastName={lastName}
                  userEmail={userEmail}
                  country={country}
                  onSuccess={onSuccess}
                  onError={(error) => {
                    console.error("💳 Payment error:", error);
                    setInitializationError(error);
                  }}
                />
              </Elements>
            </div>
          ) : (
            <div className="text-center p-4 space-y-3">
              <p className="text-destructive">{t('payment.failedToLoadForm')}</p>
              <p className="text-sm text-muted-foreground">
                {t('payment.checkConnection')}
              </p>
              <Button onClick={() => initializePayment()} className="mt-2">
                {t('payment.retry')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      
      <Button variant="outline" onClick={onBack} className="w-full">
        {t('payment.backToPlans')}
      </Button>
    </div>
  );
};

export default EmbeddedPayment;