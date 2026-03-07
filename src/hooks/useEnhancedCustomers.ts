import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedCustomer {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  country?: string;
  medical_conditions?: string[];
  created_at: string;
  profile_completion_percentage?: number;
  subscriber?: {
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
    email?: string;
    stripe_customer_id?: string;
  };
}

export function useEnhancedCustomers() {
  const query = useQuery({
    queryKey: ['enhanced-customers'],
    queryFn: async (): Promise<EnhancedCustomer[]> => {
      console.log('🔄 Fetching enhanced customer data...');
      
      // Fetch profiles and subscribers in parallel
      const [profilesResult, subscribersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            phone,
            country,
            date_of_birth,
            medical_conditions,
            profile_completion_percentage,
            created_at,
            updated_at,
            role
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('subscribers')
          .select(`
            user_id,
            email,
            subscribed,
            subscription_tier,
            subscription_end,
            stripe_customer_id
          `)
      ]);

      if (profilesResult.error) {
        console.error('❌ Error fetching profiles:', profilesResult.error);
        throw profilesResult.error;
      }
      
      if (subscribersResult.error) {
        console.error('❌ Error fetching subscribers:', subscribersResult.error);
        throw subscribersResult.error;
      }

      const profiles = profilesResult.data || [];
      const subscribers = subscribersResult.data || [];

      console.log(`✅ Fetched ${profiles.length} profiles and ${subscribers.length} subscribers`);

      // Create enhanced customer objects by joining profiles with subscribers
      const enhancedCustomers: EnhancedCustomer[] = profiles.map(profile => {
        const subscriber = subscribers.find(s => s.user_id === profile.user_id);
        
        return {
          ...profile,
          email: subscriber?.email, // Get email from subscriber
          subscriber: subscriber ? {
            subscribed: subscriber.subscribed,
            subscription_tier: subscriber.subscription_tier,
            subscription_end: subscriber.subscription_end,
            email: subscriber.email,
            stripe_customer_id: subscriber.stripe_customer_id
          } : undefined
        };
      });

      console.log(`✅ Created ${enhancedCustomers.length} enhanced customer records`);
      return enhancedCustomers;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes for real-time feel
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔔 Setting up real-time subscriptions for enhanced customers...');
    
    const profilesChannel = supabase
      .channel('profiles-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('📊 Profiles table changed:', payload);
        query.refetch();
      })
      .subscribe();

    const subscribersChannel = supabase
      .channel('subscribers-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscribers'
      }, (payload) => {
        console.log('💰 Subscribers table changed:', payload);
        query.refetch();
      })
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up enhanced customers real-time subscriptions...');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscribersChannel);
    };
  }, [query]);

  return query;
}