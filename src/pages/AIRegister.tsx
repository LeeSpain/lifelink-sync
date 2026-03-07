import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, User, Phone, MapPin, CreditCard, Check, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import EmbeddedPayment from '@/components/EmbeddedPayment';
import { TermsDialog } from '@/components/legal/TermsDialog';
import { PrivacyDialog } from '@/components/legal/PrivacyDialog';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/contexts/PreferencesContext';
import { notifyPaymentSuccess } from '@/utils/paymentSuccess';

import { PageSEO } from '@/components/PageSEO';
import { isValidEmail, isValidPhone, validatePasswordStrength } from '@/utils/security';


interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  is_popular: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  images: any[];
  status: string;
}

interface RegionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  region: string;
  features: string[];
}

interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  country: string;
  acceptTerms: boolean;
}

const AIRegister = () => {
  const navigate = useNavigate();
  console.log('🎯 AIRegister component started - checking for any cached issues');
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: '',
    acceptTerms: false,
  });
  const [dbPlans, setDbPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regionalServices, setRegionalServices] = useState<RegionalService[]>([]);
  const [selectedMainPlan, setSelectedMainPlan] = useState<string>('');
  const [hasFamilyPlan, setHasFamilyPlan] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedRegionalServices, setSelectedRegionalServices] = useState<string[]>([]);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [testingMode, setTestingMode] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language } = usePreferences();

  // Check for test mode parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
      setTestingMode(true);
      // Pre-populate with test data for convenience
      setPersonalDetails({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'testpass123',
        phone: '+34123456789',
        city: 'Madrid',
        country: 'Spain',
        acceptTerms: false,
      });
    }
  }, []);


  // Fetch plans, products, and regional services from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription plans
        const { data: plansData, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .eq('billing_interval', 'month')
          .order('sort_order');

        if (plansError) throw plansError;

        const formattedPlans = plansData.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description || '',
          price: parseFloat(plan.price.toString()),
          currency: plan.currency,
          billing_interval: plan.billing_interval,
          features: Array.isArray(plan.features) ? plan.features.map(f => String(f)) : [],
          is_popular: plan.is_popular
        }));

        setDbPlans(formattedPlans);
        
        // Set Premium Protection as default (fixed standard plan)
        const defaultPremiumPlan = formattedPlans.find(p => p.name === 'Premium Protection');
        if (defaultPremiumPlan) {
          setSelectedMainPlan(defaultPremiumPlan.id);
        }

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('status', ['active', 'coming_soon'])
          .order('sort_order');

        if (productsError) throw productsError;

        const formattedProducts = productsData.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price.toString()),
          currency: product.currency,
          features: Array.isArray(product.features) ? product.features.map(f => String(f)) : [],
          images: Array.isArray(product.images) ? product.images : [],
          status: product.status || 'active'
        }));

        setProducts(formattedProducts);

        // Fetch regional services
        const { data: servicesData, error: servicesError } = await supabase
          .from('regional_services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (servicesError) throw servicesError;

        const formattedServices = servicesData.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          price: parseFloat(service.price.toString()),
          currency: service.currency,
          region: service.region,
          features: Array.isArray(service.features) ? service.features.map(f => String(f)) : []
        }));

        setRegionalServices(formattedServices);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: t('register.loadErrorTitle', { defaultValue: 'Error loading data' }),
          description: t('register.loadErrorDesc', { defaultValue: 'Failed to load subscription options. Please refresh the page.' }),
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, []);

  const handlePersonalDetailsChange = (field: keyof PersonalDetails, value: string | boolean) => {
    setPersonalDetails(prev => ({
      ...prev,
      [field]: field === 'acceptTerms' ? value === 'true' || value === true : value
    }));
  };

  const handleMainPlanChange = (value: string) => {
    setSelectedMainPlan(value);
  };

  const handleFamilyPlanToggle = (checked: boolean) => {
    setHasFamilyPlan(checked);
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => 
      checked 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleRegionalServiceToggle = (serviceId: string, checked: boolean) => {
    setSelectedRegionalServices(prev => 
      checked 
        ? [...prev, serviceId]
        : prev.filter(id => id !== serviceId)
    );
  };

  // Simple validation for button disabled state (no side effects)
  const isFormValid = () => {
    const { firstName, lastName, email, password, phone, city, country, acceptTerms } = personalDetails;
    return firstName && lastName && email && password && phone && city && country && acceptTerms && password.length >= 6;
  };

  // Validation with toast messages (only called on submit)
  const validatePersonalDetails = () => {
    const { firstName, lastName, email, password, phone, city, country, acceptTerms } = personalDetails;
    if (!firstName || !lastName || !email || !password || !phone || !city || !country) {
      return false;
    }
    
    if (!acceptTerms) {
      toast({
        title: t('register.termsErrorTitle', { defaultValue: 'Terms Required' }),
        description: t('register.termsErrorDesc', { defaultValue: 'You must accept the Terms of Service and Privacy Policy to continue.' }),
        variant: "destructive"
      });
      return false;
    }
    if (password.length < 6) {
      toast({
        title: t('register.invalidPasswordTitle', { defaultValue: 'Invalid Password' }),
        description: t('register.invalidPasswordDesc', { defaultValue: 'Password must be at least 6 characters long.' }),
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (!validatePersonalDetails()) {
      toast({
        title: t('register.incompleteInfoTitle', { defaultValue: 'Incomplete Information' }),
        description: t('register.incompleteInfoDesc', { defaultValue: 'Please fill in all personal details before continuing.' }),
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async () => {
    try {
      // Create Supabase user account
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personalDetails.email,
        password: personalDetails.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: personalDetails.firstName,
            last_name: personalDetails.lastName,
            phone: personalDetails.phone
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          // User exists, try to sign them in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: personalDetails.email,
            password: personalDetails.password,
          });
          
          if (signInError) {
            toast({
              title: "Account Creation Failed",
              description: "Email already exists but password doesn't match. Please use a different email or sign in with existing credentials.",
              variant: "destructive"
            });
            return;
          }
        } else {
          throw authError;
        }
      }

      // Create or update profile record
      if (authData?.user || !authError) {
        const userId = authData?.user?.id;
        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: userId,
              first_name: personalDetails.firstName,
              last_name: personalDetails.lastName,
              phone: personalDetails.phone,
              address: `${personalDetails.city}, ${personalDetails.country}`,
              country: personalDetails.country,
              emergency_contacts: [],
              medical_conditions: [],
              allergies: [],
              medications: []
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }

        // Send welcome email (non-blocking)
        try {
          const selectedPlanName = dbPlans.find(p => p.id === selectedMainPlan)?.name;
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              userId,
              email: personalDetails.email,
              firstName: personalDetails.firstName,
              lastName: personalDetails.lastName,
              subscriptionTier: selectedPlanName
            }
          });
        } catch (e) {
          console.warn('Welcome email failed:', e);
        }
        }
      }

      // Store welcome data for the PaymentSuccess page
      const welcomeData = {
        firstName: personalDetails.firstName,
        lastName: personalDetails.lastName,
        email: personalDetails.email,
        subscriptionPlans: getSelectedSubscriptionPlans(),
        products: selectedProducts,
        regionalServices: selectedRegionalServices,
        totalAmount: calculateGrandTotal()
      };
      
      sessionStorage.setItem('welcomeData', JSON.stringify(welcomeData));
      
      // Notify payment success for cross-tab updates
      notifyPaymentSuccess('subscription');

      toast({
        title: t('register.successTitle', { defaultValue: 'Registration Complete!' }),
        description: t('register.successDesc', { defaultValue: 'Welcome to LifeLink Sync. You can now access your dashboard.' }),
      });
      
      // Redirect to payment success page
      setTimeout(() => {
        navigate('/payment-success');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: t('register.errorTitle', { defaultValue: 'Registration Error' }),
        description: t('register.errorDesc', { defaultValue: 'Failed to create your account. Please try again or contact support.' }),
        variant: "destructive"
      });
    }
  };


  // Helper functions using original data
  console.log('🔍 AIRegister: Finding premium plan from dbPlans:', dbPlans.length, 'plans');
  const premiumPlan = dbPlans.find(p => p.name === 'Premium Protection');
  const familyPlan = dbPlans.find(p => p.name.includes('Family'));
  console.log('🔍 AIRegister: Found premiumPlan:', premiumPlan?.name, 'familyPlan:', familyPlan?.name);

  // Tax rates
  const PRODUCT_IVA_RATE = 0.21; // 21% for products
  const SERVICE_IVA_RATE = 0.10; // 10% for regional services

  const calculateSubscriptionTotal = () => {
    let total = premiumPlan ? premiumPlan.price : 0;
    if (hasFamilyPlan && familyPlan) {
      total += familyPlan.price;
    }
    // Add regional services (subscription-based) with IVA
    selectedRegionalServices.forEach(serviceId => {
      const service = regionalServices.find(s => s.id === serviceId);
      if (service) {
        const priceWithIva = service.price * (1 + SERVICE_IVA_RATE);
        total += priceWithIva;
      }
    });
    return total;
  };

  const calculateProductTotal = () => {
    let total = 0;
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const priceWithIva = product.price * (1 + PRODUCT_IVA_RATE);
        total += priceWithIva;
      }
    });
    return total;
  };

  const calculateProductsSubtotal = () => {
    let total = 0;
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) total += product.price;
    });
    return total;
  };

  const calculateServicesSubtotal = () => {
    let total = 0;
    selectedRegionalServices.forEach(serviceId => {
      const service = regionalServices.find(s => s.id === serviceId);
      if (service) total += service.price;
    });
    return total;
  };

  const calculateGrandTotal = () => {
    return calculateSubscriptionTotal() + calculateProductTotal();
  };

  const getSelectedSubscriptionPlans = (): string[] => {
    const planIds: string[] = [];
    if (premiumPlan) planIds.push(premiumPlan.id);
    if (hasFamilyPlan && familyPlan) planIds.push(familyPlan.id);
    // Add selected regional services as they are subscription-based
    planIds.push(...selectedRegionalServices);
    return planIds;
  };

  const getAllSelections = () => {
    return {
      subscriptionPlans: getSelectedSubscriptionPlans(),
      products: selectedProducts,
      regionalServices: selectedRegionalServices
    };
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Join LifeLink Sync – Emergency Protection Registration",
    "description": "Register for LifeLink Sync emergency protection service. Quick setup with AI assistance and instant access to life-saving features.",
    "provider": {
      "@type": "Organization",
      "name": "LifeLink Sync",
      "url": "https://lifelink-sync.com"
    },
    "mainEntity": {
      "@type": "Service",
      "name": "LifeLink Sync Emergency Protection",
      "category": "Emergency Response Service",
      "provider": {
        "@type": "Organization",
        "name": "LifeLink Sync"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <PageSEO pageType="ai-register" />
      <Navigation />
      
      
      {/* Registration Form */}
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="text-center border-b bg-gradient-to-r from-emergency/5 to-primary/5 py-6">
              <div className="flex justify-center items-center gap-3 mb-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              {testingMode && (
                <div className="flex justify-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    Test Mode - €1.00 Payment
                  </Badge>
                </div>
              )}
              <CardTitle className="text-3xl font-bold text-foreground">
                {currentStep === 'details' ? (testingMode ? 'Test Registration - €1.00' : 'Emergency Protection Registration') : 'Complete Your Payment'}
              </CardTitle>
              <CardDescription className="text-lg">
                {currentStep === 'details' ? 'Join LifeLink Sync and secure your emergency protection' : 'Finalize your subscription and start protecting what matters most'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              {currentStep === 'details' ? (
                <div className="space-y-8">
                  {/* Personal Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Personal Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={personalDetails.firstName}
                          onChange={(e) => handlePersonalDetailsChange('firstName', e.target.value)}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={personalDetails.lastName}
                          onChange={(e) => handlePersonalDetailsChange('lastName', e.target.value)}
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalDetails.email}
                          onChange={(e) => handlePersonalDetailsChange('email', e.target.value)}
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={personalDetails.password}
                          onChange={(e) => handlePersonalDetailsChange('password', e.target.value)}
                          placeholder="Enter your password (min. 6 characters)"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={personalDetails.phone}
                          onChange={(e) => handlePersonalDetailsChange('phone', e.target.value)}
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={personalDetails.city}
                          onChange={(e) => handlePersonalDetailsChange('city', e.target.value)}
                          placeholder="Enter your city"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={personalDetails.country}
                          onChange={(e) => handlePersonalDetailsChange('country', e.target.value)}
                          placeholder="Enter your country"
                          required
                        />
                       </div>
                     </div>

                   </div>

                  {/* Protection Plans */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emergency/10 rounded-full">
                        <Shield className="h-5 w-5 text-emergency" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Protection Plans</h2>
                    </div>
                    
                    {/* Premium Protection Plan - Fixed Standard */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-foreground">Standard Protection Plan:</h3>
                      {premiumPlan && (
                        <div className="p-4 border-2 border-primary bg-primary/5 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">{premiumPlan.name}</h3>
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                  Standard
                                </span>
                              </div>
                              <p className="text-muted-foreground mb-3">{premiumPlan.description}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {premiumPlan.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-sm">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">
                                  Net: €{premiumPlan.price}
                                </div>
                                <div className="font-bold text-lg text-primary">
                                  €{premiumPlan.price}
                                </div>
                                <div className="text-sm text-muted-foreground">per {premiumPlan.billing_interval}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Optional Add-ons Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-full">
                          <Star className="h-5 w-5 text-secondary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Optional Add-ons</h3>
                      </div>

                      {/* Family Membership Payment Info */}
                      <div className="bg-gradient-to-r from-wellness/10 to-wellness/5 border border-wellness/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-wellness/20 rounded-full">
                            <Shield className="h-4 w-4 text-wellness" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Family Membership Payment</h4>
                            <p className="text-sm text-muted-foreground">
                              Once your account is set up, you can invite family members to join your emergency network. 
                              Each family member connection costs <span className="font-medium text-foreground">€2.99 per month</span> and 
                              will be billed separately after they accept your invitation and set up their account.
                            </p>
                          </div>
                        </div>
                      </div>


                      {/* Safety Products Section */}
                      {products.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Safety Products (One-time purchase):</h4>
                          {products.map((product) => {
                            const priceWithIva = product.price * (1 + PRODUCT_IVA_RATE);
                            return (
                              <div key={product.id} className={`p-3 border rounded-lg transition-all ${
                                selectedProducts.includes(product.id) ? 'border-primary bg-primary/5' : 'border-border'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={product.id}
                                    checked={selectedProducts.includes(product.id)}
                                    disabled={product.status === 'coming_soon'}
                                    onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                                    className="mt-1"
                                  />
                                  <Label htmlFor={product.id} className="flex-1 cursor-pointer">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-base mb-1 flex items-center gap-2">{product.name}{product.status === 'coming_soon' && (
                                          <Badge className="bg-secondary text-white">{t('common.comingSoon', { defaultValue: 'Coming Soon' })}</Badge>
                                        )}</h4>
                                        <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
                                        {product.features.length > 0 && (
                                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {product.features.slice(0, 3).map((feature, idx) => (
                                              <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Check className="h-3 w-3 text-green-500" />
                                                <span>{feature}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/50 shadow-sm">
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-muted-foreground">Net Price:</span>
                                              <span className="font-medium">€{product.price}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="text-muted-foreground">IVA (21%):</span>
                                              <span className="font-medium">+ €{(product.price * PRODUCT_IVA_RATE).toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-border pt-2">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold text-foreground">Total:</span>
                                                <span className="font-bold text-lg text-primary">€{priceWithIva.toFixed(2)}</span>
                                              </div>
                                              <div className="text-center mt-1">
                                                <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                                                  One-time purchase
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Regional Services Section */}
                      {regionalServices.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Regional Services (Monthly subscription):</h4>
                          {regionalServices.map((service) => {
                            const priceWithIva = service.price * (1 + SERVICE_IVA_RATE);
                            return (
                              <div key={service.id} className={`p-3 border rounded-lg transition-all ${
                                selectedRegionalServices.includes(service.id) ? 'border-primary bg-primary/5' : 'border-border'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={service.id}
                                    checked={selectedRegionalServices.includes(service.id)}
                                    onCheckedChange={(checked) => handleRegionalServiceToggle(service.id, checked as boolean)}
                                    className="mt-1"
                                  />
                                  <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold text-base">{service.name}</h4>
                                          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                                            {service.region}
                                          </span>
                                        </div>
                                        <p className="text-muted-foreground text-sm mb-2">{service.description}</p>
                                        {service.features.length > 0 && (
                                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {service.features.slice(0, 3).map((feature, idx) => (
                                              <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Check className="h-3 w-3 text-green-500" />
                                                <span>{feature}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/50 shadow-sm">
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-muted-foreground">Net Price:</span>
                                              <span className="font-medium">€{service.price}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-muted-foreground">IVA (10%):</span>
                                              <span className="font-medium">+ €{(service.price * SERVICE_IVA_RATE).toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-border pt-2">
                                              <div className="flex justify-between items-center">
                                                <span className="font-semibold text-foreground">Total:</span>
                                                <span className="font-bold text-lg text-primary">€{priceWithIva.toFixed(2)}</span>
                                              </div>
                                              <div className="text-center mt-1">
                                                <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                                                  Monthly subscription
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Order Summary */}
                    <div className="border-t pt-6 space-y-4 bg-gradient-to-br from-muted/20 to-muted/40 -mx-8 px-8 pb-6 mt-8 rounded-b-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-bold text-lg text-foreground">Order Summary</h4>
                      </div>
                      
                      {/* Monthly Subscriptions Section */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-border/30 shadow-sm">
                        <h5 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Monthly Subscriptions</h5>
                        
                        {/* Premium Protection Plan */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-foreground text-base">Premium Protection Plan</div>
                              <div className="text-sm text-muted-foreground mt-1">Standard emergency protection • Monthly subscription</div>
                            </div>
                            <div className="text-right ml-6">
                              <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/50 shadow-sm">
                                <div className="font-bold text-lg text-foreground">€{premiumPlan?.price || 0}</div>
                                <div className="text-xs text-muted-foreground mt-1">per month</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Family Plan */}
                          {hasFamilyPlan && familyPlan && (
                            <div className="flex justify-between items-start border-t border-border/30 pt-4">
                              <div className="flex-1">
                                <div className="font-medium text-foreground text-base">{familyPlan.name}</div>
                                <div className="text-sm text-muted-foreground mt-1">Family protection add-on • Monthly subscription</div>
                              </div>
                              <div className="text-right ml-6">
                                <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/50 shadow-sm">
                                  <div className="font-bold text-lg text-foreground">€{familyPlan.price}</div>
                                  <div className="text-xs text-muted-foreground mt-1">per month</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Regional Services */}
                          {selectedRegionalServices.length > 0 && selectedRegionalServices.map(serviceId => {
                            const service = regionalServices.find(s => s.id === serviceId);
                            if (!service) return null;
                            const netPrice = service.price;
                            const ivaAmount = service.price * SERVICE_IVA_RATE;
                            const totalPrice = service.price * (1 + SERVICE_IVA_RATE);
                            return (
                              <div key={serviceId} className="border-t border-border/30 pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground text-base">{service.name}</div>
                                    <div className="text-sm text-muted-foreground mt-1">{service.region} • Regional service • Monthly subscription</div>
                                  </div>
                                  <div className="text-right ml-6">
                                    <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/50 shadow-sm">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-muted-foreground">Net Price:</span>
                                          <span className="font-medium">€{netPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground">IVA (10%):</span>
                                          <span className="font-medium">+ €{ivaAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-border pt-2">
                                          <div className="flex justify-between items-center">
                                            <span className="font-semibold text-foreground">Total:</span>
                                            <span className="font-bold text-lg text-foreground">€{totalPrice.toFixed(2)}</span>
                                          </div>
                                          <div className="text-center mt-1">
                                            <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                                              Monthly subscription
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* One-time Products Section */}
                      {selectedProducts.length > 0 && (
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-border/30 shadow-sm">
                          <h5 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Safety Products (One-time purchase)</h5>
                          <div className="space-y-4">
                            {selectedProducts.map(productId => {
                              const product = products.find(p => p.id === productId);
                              if (!product) return null;
                              const netPrice = product.price;
                              const ivaAmount = product.price * PRODUCT_IVA_RATE;
                              const totalPrice = product.price * (1 + PRODUCT_IVA_RATE);
                              return (
                                <div key={productId} className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground text-base">{product.name}</div>
                                    <div className="text-sm text-muted-foreground mt-1">Safety equipment • One-time purchase</div>
                                  </div>
                                  <div className="text-right ml-6">
                                    <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/50 shadow-sm">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-muted-foreground">Net Price:</span>
                                          <span className="font-medium">€{netPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground">IVA (21%):</span>
                                          <span className="font-medium">+ €{ivaAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-border pt-2">
                                          <div className="flex justify-between items-center">
                                            <span className="font-semibold text-foreground">Total:</span>
                                            <span className="font-bold text-lg text-foreground">€{totalPrice.toFixed(2)}</span>
                                          </div>
                                          <div className="text-center mt-1">
                                            <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                                              One-time purchase
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Summary */}
                      <div className="bg-gradient-to-r from-primary/10 to-emergency/10 rounded-lg p-6 border-2 border-primary/20 shadow-lg">
                        <div className="space-y-3">
                          {/* Monthly Subscription Total */}
                          <div className="flex justify-between items-center pb-2 border-b border-border/30">
                            <div>
                              <span className="font-semibold text-foreground">Monthly Subscription:</span>
                              <div className="text-sm text-muted-foreground">Recurring monthly charge</div>
                            </div>
                            <span className="font-bold text-lg text-foreground">€{calculateSubscriptionTotal().toFixed(2)}/month</span>
                          </div>
                          
                          {/* One-time Products Total */}
                          {calculateProductTotal() > 0 && (
                            <div className="flex justify-between items-center pb-2 border-b border-border/30">
                              <div>
                                <span className="font-semibold text-foreground">One-time Products:</span>
                                <div className="text-sm text-muted-foreground">Today only charge</div>
                              </div>
                              <span className="font-bold text-lg text-foreground">€{calculateProductTotal().toFixed(2)}</span>
                            </div>
                          )}
                          
                          {/* Total Payment Today */}
                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <span className="text-xl font-bold text-foreground">Total Payment Today:</span>
                              <div className="text-sm text-muted-foreground">
                                {calculateProductTotal() > 0 ? 'Monthly + one-time charges' : 'Monthly subscription charge'}
                              </div>
                            </div>
                            <span className="text-3xl font-bold text-foreground">€{calculateGrandTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tax Notice */}
                      <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg border border-border/30">
                        <strong>Tax Information:</strong> Products include 21% IVA, Regional Services include 10% IVA. All prices shown include applicable taxes.
                      </div>
                    </div>
                  </div>


                  {/* Terms and Conditions Checkbox - Enhanced Visibility */}
                  <div className="space-y-3 mt-6">
                    <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      personalDetails.acceptTerms 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-destructive/50 bg-destructive/5 shadow-sm'
                    }`}>
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          id="acceptTerms"
                          checked={personalDetails.acceptTerms}
                          onCheckedChange={(checked) => 
                            handlePersonalDetailsChange('acceptTerms', checked as boolean ? 'true' : 'false')
                          }
                          className="mt-1 h-5 w-5"
                        />
                        <div className="grid gap-1.5 leading-none flex-1">
                          <Label
                            htmlFor="acceptTerms"
                            className="text-base font-medium leading-relaxed cursor-pointer text-black"
                          >
                            I agree to the{" "}
                            <button
                              type="button"
                              onClick={() => setShowTermsDialog(true)}
                              className="text-primary hover:underline font-semibold underline-offset-2"
                            >
                              Terms of Service
                            </button>{" "}
                            and{" "}
                            <button
                              type="button"
                              onClick={() => setShowPrivacyDialog(true)}
                              className="text-primary hover:underline font-semibold underline-offset-2"
                            >
                              Privacy Policy
                            </button>
                          </Label>
                          {!personalDetails.acceptTerms && (
                            <p className="text-sm text-black font-medium mt-2">
                              ⚠️ Required: You must accept the terms to continue
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="pt-6">
                    <Button 
                      onClick={handleContinueToPayment}
                      className="w-full bg-emergency hover:bg-emergency/90"
                      size="lg"
                      disabled={!isFormValid()}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {testingMode ? 'Complete Registration (Free)' : 'Continue to Payment'}
                    </Button>
                  </div>
                </div>
              ) : (
                <EmbeddedPayment
                  plans={getSelectedSubscriptionPlans()}
                  products={selectedProducts}
                  regionalServices={selectedRegionalServices}
                  userEmail={personalDetails.email}
                  firstName={personalDetails.firstName}
                  lastName={personalDetails.lastName}
                  password={personalDetails.password}
                  phone={personalDetails.phone}
                  city={personalDetails.city}
                  country={personalDetails.country}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setCurrentStep('details')}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legal Dialogs */}
      <TermsDialog 
        open={showTermsDialog} 
        onOpenChange={setShowTermsDialog}
      />
      <PrivacyDialog 
        open={showPrivacyDialog} 
        onOpenChange={setShowPrivacyDialog}
      />
    </div>
  );
};

export default AIRegister;