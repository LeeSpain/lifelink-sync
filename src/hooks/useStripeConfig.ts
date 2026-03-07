import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StripeConfig {
  publishableKey: string | null;
  loading: boolean;
  error: string | null;
}

export const useStripeConfig = (): StripeConfig => {
  const [config, setConfig] = useState<StripeConfig>({
    publishableKey: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchStripeConfig();
  }, []);

  const fetchStripeConfig = async () => {
    try {
      setConfig(prev => ({ ...prev, loading: true, error: null }));
      
      // Get Stripe publishable key from edge function for production security
      const { data, error } = await supabase.functions.invoke('get-stripe-config');
      
      if (error) {
        console.error('Failed to fetch Stripe config:', error);
        setConfig(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to load payment configuration' 
        }));
        return;
      }

      if (!data?.publishableKey) {
        setConfig(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Payment configuration not available' 
        }));
        return;
      }

      setConfig({
        publishableKey: data.publishableKey,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      setConfig(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Unable to connect to payment system' 
      }));
    }
  };

  return config;
};