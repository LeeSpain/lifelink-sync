import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, TestTube, CreditCard, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import EmbeddedPayment from '@/components/EmbeddedPayment';
import { Badge } from '@/components/ui/badge';
import { PageSEO } from '@/components/PageSEO';
import { notifyPaymentSuccess } from '@/utils/paymentSuccess';

interface TestPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
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

const TestRegistration = () => {
  const navigate = useNavigate();
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'testpass123',
    phone: '+34123456789',
    city: 'Madrid',
    country: 'Spain',
    acceptTerms: false,
  });
  const [testPlan, setTestPlan] = useState<TestPlan | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch the 1 Euro test plan
  useEffect(() => {
    const fetchTestPlan = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('name', 'Test Plan - 1 Euro')
          .eq('is_active', true)
          .single();

        if (error) throw error;

        setTestPlan({
          id: data.id,
          name: data.name,
          description: data.description,
          price: parseFloat(data.price.toString()),
          currency: data.currency,
          features: Array.isArray(data.features) ? data.features.map(f => String(f)) : []
        });
      } catch (error) {
        console.error('Error fetching test plan:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test plan. Please refresh the page.',
          variant: "destructive"
        });
      }
    };

    fetchTestPlan();
  }, []);

  const handlePersonalDetailsChange = (field: keyof PersonalDetails, value: string | boolean) => {
    setPersonalDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    const { firstName, lastName, email, password, phone, city, country, acceptTerms } = personalDetails;
    return firstName && lastName && email && password && phone && city && country && acceptTerms;
  };

  const handleContinueToPayment = () => {
    if (!isFormValid()) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all details and accept terms.',
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async () => {
    try {
      setIsLoading(true);
      
      // Create test user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personalDetails.email,
        password: personalDetails.password,
        options: {
          data: {
            first_name: personalDetails.firstName,
            last_name: personalDetails.lastName,
            phone: personalDetails.phone
          }
        }
      });

      if (authError && !authError.message.includes("already registered")) {
        throw authError;
      }

      // Prepare welcome data for success page
      const welcomeData = {
        firstName: personalDetails.firstName,
        lastName: personalDetails.lastName,
        email: personalDetails.email,
        subscriptionPlans: testPlan ? [testPlan] : [],
        products: [],
        regionalServices: [],
        totalAmount: testPlan ? testPlan.price : 0
      };
      sessionStorage.setItem('welcomeData', JSON.stringify(welcomeData));
      notifyPaymentSuccess('subscription');

      toast({
        title: 'Test Registration Complete!',
        description: 'Test payment processed successfully. Redirecting...',
      });

      // Redirect to payment success page
      setTimeout(() => {
        navigate('/payment-success');
      }, 1500);
    } catch (error) {
      console.error('Test registration error:', error);
      toast({
        title: 'Test Registration Error',
        description: 'Failed to complete test registration.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!testPlan) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <PageSEO pageType="test-registration" />
      <Navigation />
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="text-center border-b bg-gradient-to-r from-orange-50 to-yellow-50 py-6">
              <div className="flex justify-center items-center gap-3 mb-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <TestTube className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="flex justify-center gap-2 mb-4">
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  Test Mode
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  €1.00 Only
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                {currentStep === 'details' ? 'Test Registration Form' : 'Test Payment Processing'}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Complete registration flow testing with minimal cost payment verification
              </p>
            </CardHeader>

            <CardContent className="p-8">
              {currentStep === 'details' ? (
                <div className="space-y-6">
                  {/* Test Plan Display */}
                  <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-orange-900">{testPlan.name}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">€{testPlan.price}</div>
                          <div className="text-sm text-orange-700">per month</div>
                        </div>
                      </div>
                      <p className="text-orange-800 mb-4">{testPlan.description}</p>
                      <div className="space-y-2">
                        {testPlan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-800">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pre-filled Form */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={personalDetails.firstName}
                          onChange={(e) => handlePersonalDetailsChange('firstName', e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={personalDetails.lastName}
                          onChange={(e) => handlePersonalDetailsChange('lastName', e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalDetails.email}
                          onChange={(e) => handlePersonalDetailsChange('email', e.target.value)}
                          placeholder="Email address"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={personalDetails.password}
                          onChange={(e) => handlePersonalDetailsChange('password', e.target.value)}
                          placeholder="Password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={personalDetails.phone}
                          onChange={(e) => handlePersonalDetailsChange('phone', e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={personalDetails.city}
                          onChange={(e) => handlePersonalDetailsChange('city', e.target.value)}
                          placeholder="City"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={personalDetails.acceptTerms}
                      onCheckedChange={(checked) => handlePersonalDetailsChange('acceptTerms', checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I accept the Terms of Service and Privacy Policy (Test Mode)
                    </Label>
                  </div>

                  <Button
                    onClick={handleContinueToPayment}
                    disabled={!isFormValid()}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Continue to Test Payment (€1.00)
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-5 w-5 text-orange-600" />
                      <span className="font-semibold text-orange-900">Test Payment Mode</span>
                    </div>
                    <p className="text-sm text-orange-800">
                      This is a live test transaction for €1.00 that will verify the complete payment flow including Stripe processing.
                    </p>
                  </div>

                  <EmbeddedPayment
                    plans={[testPlan.id]}
                    products={[]}
                    regionalServices={[]}
                    userEmail={personalDetails.email}
                    firstName={personalDetails.firstName}
                    lastName={personalDetails.lastName}
                    password={personalDetails.password}
                    phone={personalDetails.phone}
                    city={personalDetails.city}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setCurrentStep('details')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestRegistration;