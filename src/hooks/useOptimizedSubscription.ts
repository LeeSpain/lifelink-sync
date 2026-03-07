import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Centralized subscription query key
export const SUBSCRIPTION_QUERY_KEY = ['user', 'subscription'] as const;

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export function useOptimizedSubscription() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async (): Promise<SubscriptionData> => {
      if (!user?.id) {
        return {
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
        };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }
      
      return data as SubscriptionData;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - subscription status doesn't change frequently
    gcTime: 15 * 60 * 1000, // 15 minutes in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only if stale
    retry: 1,
  });
}