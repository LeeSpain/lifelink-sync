import React, { useState, useEffect } from 'react';
import { X, Gift, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { trackCustomEvent } from '@/hooks/usePageTracking';
import { startTrialFunnel, completeTrialStep } from '@/lib/conversionTracking';

interface FreeTrialPopupProps {
  onClose: () => void;
}

export const FreeTrialPopup = ({ onClose }: FreeTrialPopupProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  // Track popup shown
  useEffect(() => {
    const funnelKey = startTrialFunnel();
    completeTrialStep(funnelKey, 'popup_shown');
    
    trackCustomEvent('trial_popup_shown', {
      popup_type: 'free_trial',
      timestamp: Date.now(),
      funnel_key: funnelKey
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to start your free trial.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('free-trial-signup', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          sessionId: crypto.randomUUID()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "🎉 Free Trial Activated!",
        description: "Check your email for next steps. Welcome to LifeLink Sync!",
        duration: 5000
      });

      // Track successful signup
      await trackCustomEvent('trial_signup_completed', {
        popup_type: 'free_trial',
        signup_data: {
          has_name: !!formData.name,
          has_email: !!formData.email,
          has_phone: !!formData.phone
        }
      });

      // Store in localStorage to prevent showing again
      localStorage.setItem('lifelinksync-trial-signup', 'true');
      onClose();

    } catch (error: any) {
      console.error('Trial signup error:', error);
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 bg-gradient-to-br from-white to-gray-50 border-2 border-primary/20 shadow-2xl animate-scale-in relative z-[10000]">
        <CardHeader className="relative text-center">
          <button
            onClick={() => {
              trackCustomEvent('trial_popup_closed', {
                popup_type: 'free_trial',
                close_method: 'x_button'
              });
              onClose();
            }}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            Start Your 7-Day Free Trial
          </CardTitle>
          <CardDescription className="text-gray-600">
            Experience complete emergency protection - no payment required!
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Full Protection</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">7 Days Free</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="mt-1"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 transition-all duration-200"
            >
              {isSubmitting ? 'Starting Your Trial...' : 'Start Free Trial Now'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                trackCustomEvent('trial_popup_dismissed', {
                  popup_type: 'free_trial',
                  dismiss_method: 'not_interested'
                });
                onClose();
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
            >
              Not interested right now
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center font-medium">
              📧 After signing up, check your email to activate your trial
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            No credit card required. Cancel anytime during trial.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};