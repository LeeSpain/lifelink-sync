import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isValidEmail, validatePasswordStrength } from '@/utils/security';

import WelcomeStep from './steps/WelcomeStep';
import AccountStep from './steps/AccountStep';
import ProfileStep from './steps/ProfileStep';
import PlanStep from './steps/PlanStep';
import EmergencyContactsStep, { type EmergencyContact } from './steps/EmergencyContactsStep';
import PaymentStep from './steps/PaymentStep';
import CompleteStep from './steps/CompleteStep';

interface WizardData {
  // Account
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  // Profile
  phone: string;
  city: string;
  country: string;
  dateOfBirth: string;
  // Plan
  selectedPlanId: string;
  isTrialSelected: boolean;
  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
}

const STORAGE_KEY = 'lifelink_registration_wizard';

const STEP_IDS = ['welcome', 'account', 'profile', 'plan', 'contacts', 'payment', 'complete'] as const;

const initialData: WizardData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  acceptTerms: false,
  phone: '',
  city: '',
  country: '',
  dateOfBirth: '',
  selectedPlanId: '',
  isTrialSelected: false,
  emergencyContacts: [{ name: '', phone: '', email: '', relationship: '', notifyChannels: ['app'] }],
};

const RegistrationWizard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => {
    // Restore from session storage
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      }
    } catch {}
    return initialData;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);

  const STEPS = STEP_IDS.map(id => ({ id, label: t(`registration.steps.${id}`) }));

  // Pre-select trial if coming from /trial-signup
  useEffect(() => {
    if (searchParams.get('trial') === 'true') {
      setData(prev => ({ ...prev, isTrialSelected: true }));
    }
  }, [searchParams]);

  // Persist to session storage on data change
  useEffect(() => {
    try {
      // Don't persist password
      const { password, ...safeData } = data;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
    } catch {}
  }, [data]);

  const handleChange = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Determine visible steps (skip payment for trial)
  const getVisibleSteps = () => {
    if (data.isTrialSelected) {
      return STEPS.filter(s => s.id !== 'payment');
    }
    return STEPS;
  };

  const visibleSteps = getVisibleSteps();
  const currentStepId = visibleSteps[currentStep]?.id;
  const progressPercent = ((currentStep) / (visibleSteps.length - 1)) * 100;

  // Validation per step
  const validateCurrentStep = (): boolean => {
    switch (currentStepId) {
      case 'account': {
        if (!data.firstName.trim() || !data.lastName.trim()) {
          toast({ title: t('registration.validation.nameRequired'), description: t('registration.validation.nameRequiredDesc'), variant: 'destructive' });
          return false;
        }
        if (!isValidEmail(data.email)) {
          toast({ title: t('registration.validation.invalidEmail'), description: t('registration.validation.invalidEmailDesc'), variant: 'destructive' });
          return false;
        }
        const pwCheck = validatePasswordStrength(data.password);
        if (!pwCheck.isValid) {
          toast({ title: t('registration.validation.weakPassword'), description: pwCheck.errors[0], variant: 'destructive' });
          return false;
        }
        if (!data.acceptTerms) {
          toast({ title: t('registration.validation.termsRequired'), description: t('registration.validation.termsRequiredDesc'), variant: 'destructive' });
          return false;
        }
        return true;
      }
      case 'profile': {
        if (!data.phone.trim()) {
          toast({ title: t('registration.validation.phoneRequired'), description: t('registration.validation.phoneRequiredDesc'), variant: 'destructive' });
          return false;
        }
        if (!data.city.trim() || !data.country) {
          toast({ title: t('registration.validation.locationRequired'), description: t('registration.validation.locationRequiredDesc'), variant: 'destructive' });
          return false;
        }
        return true;
      }
      case 'plan': {
        if (!data.selectedPlanId && !data.isTrialSelected) {
          toast({ title: t('registration.validation.planRequired'), description: t('registration.validation.planRequiredDesc'), variant: 'destructive' });
          return false;
        }
        return true;
      }
      case 'contacts': {
        const validContacts = data.emergencyContacts.filter(c => c.name.trim() && c.phone.trim());
        if (validContacts.length === 0) {
          toast({ title: t('registration.validation.contactRequired'), description: t('registration.validation.contactRequiredDesc'), variant: 'destructive' });
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  // Create Supabase account
  const createAccount = async (): Promise<boolean> => {
    if (accountCreated) return true;
    setIsProcessing(true);
    setAccountError('');

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: redirectUrl }
      });

      if (authError) {
        // If user exists, try to sign in
        if (authError.message?.toLowerCase().includes('already registered') ||
            authError.message?.toLowerCase().includes('already been registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          if (signInError) {
            setAccountError(t('registration.errors.accountExists'));
            return false;
          }
          setAccountCreated(true);
          return true;
        }
        setAccountError(authError.message);
        return false;
      }

      setAccountCreated(true);
      return true;
    } catch (err) {
      setAccountError(t('registration.errors.createFailed'));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Save profile to Supabase
  const saveProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      await supabase.from('profiles').upsert({
        user_id: userData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        address: data.city,
        country: data.country,
        emergency_contacts: data.emergencyContacts.filter(c => c.name && c.phone),
        medical_conditions: [],
        allergies: [],
        medications: [],
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  // Activate trial
  const activateTrial = async () => {
    try {
      await supabase.functions.invoke('activate-trial');
    } catch (err) {
      console.error('Failed to activate trial:', err);
    }
  };

  // Send welcome email
  const sendWelcomeEmail = async () => {
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          firstName: data.firstName,
          email: data.email,
          tier: data.isTrialSelected ? 'trial' : 'premium',
        }
      });
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
  };

  // Handle completing all the post-registration tasks
  const finalizeRegistration = async () => {
    setIsProcessing(true);
    try {
      await saveProfile();

      if (data.isTrialSelected) {
        await activateTrial();
      }

      // Non-blocking welcome email
      sendWelcomeEmail();

      // Clear session storage
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Finalization error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    // After account step, create the Supabase account
    if (currentStepId === 'account') {
      const success = await createAccount();
      if (!success) return;
    }

    // After contacts step (for trial), finalize
    if (currentStepId === 'contacts') {
      if (data.isTrialSelected) {
        await finalizeRegistration();
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handlePaymentSuccess = async () => {
    await finalizeRegistration();
    setCurrentStep(visibleSteps.length - 1); // Go to complete step
  };

  // Render current step content
  const renderStep = () => {
    switch (currentStepId) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;
      case 'account':
        return <AccountStep data={data} onChange={handleChange} error={accountError} />;
      case 'profile':
        return <ProfileStep data={data} onChange={handleChange} />;
      case 'plan':
        return <PlanStep data={data} onChange={handleChange} />;
      case 'contacts':
        return (
          <EmergencyContactsStep
            contacts={data.emergencyContacts}
            onChange={(contacts) => handleChange('emergencyContacts', contacts)}
          />
        );
      case 'payment':
        return (
          <PaymentStep
            data={data}
            onSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        );
      case 'complete':
        return <CompleteStep firstName={data.firstName} isTrialSelected={data.isTrialSelected} />;
      default:
        return null;
    }
  };

  const showBackButton = currentStep > 0 && currentStepId !== 'complete' && currentStepId !== 'payment';
  const showNextButton = currentStepId !== 'welcome' && currentStepId !== 'complete' && currentStepId !== 'payment';

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        {currentStepId !== 'welcome' && currentStepId !== 'complete' && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80 font-medium">
                {t('registration.stepOf', { current: currentStep, total: visibleSteps.length - 2 })}
              </span>
              <span className="text-white/60">
                {visibleSteps[currentStep]?.label}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-white/20" />
          </div>
        )}

        {/* Main Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="p-6 sm:p-8">
            {renderStep()}

            {/* Navigation */}
            {(showBackButton || showNextButton) && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                {showBackButton ? (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isProcessing}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('registration.back')}
                  </Button>
                ) : <div />}

                {showNextButton && (
                  <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('registration.processing')}
                      </>
                    ) : currentStepId === 'contacts' && data.isTrialSelected ? (
                      <>
                        {t('registration.startTrial')}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        {t('registration.continue')}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {currentStepId !== 'complete' && (
          <div className="text-center mt-4">
            <p className="text-xs text-white/60">
              {t('registration.alreadyHaveAccount')}{' '}
              <button
                onClick={() => navigate('/auth')}
                className="text-white hover:underline font-medium"
              >
                {t('registration.signIn')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationWizard;
