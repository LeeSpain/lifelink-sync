import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealTimeCustomerMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeSubscriptions: number;
  totalRevenue: number;
  premiumSubscriptions: number;
  callCentreSubscriptions: number;
  averageRevenuePerCustomer: number;
  subscriptionConversionRate: number;
  premiumPlanPrice: number;
  subscriptionStatusBreakdown: {
    active: number;
    inactive: number;
    cancelled: number;
    expired: number;
  };
}

export function useRealTimeCustomerData() {
  const query = useQuery({
    queryKey: ['real-time-customer-data'],
    queryFn: async (): Promise<RealTimeCustomerMetrics> => {
      console.log('🔄 Fetching real-time customer data...');
      
      try {
        // Fetch data directly from Supabase tables for more reliable metrics
        const [profilesResult, subscribersResult, subscriptionPlansResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('created_at, user_id, role')
            .neq('role', 'admin'), // Exclude admin users from customer count
          
          supabase
            .from('subscribers')
            .select('user_id, subscribed, subscription_tier, email, subscription_end'),
          
          supabase
            .from('subscription_plans')
            .select('name, price, is_active')
            .eq('is_active', true)
        ]);

        if (profilesResult.error) {
          console.error('❌ Error fetching profiles:', profilesResult.error);
          throw profilesResult.error;
        }

        if (subscribersResult.error) {
          console.error('❌ Error fetching subscribers:', subscribersResult.error);
          throw subscribersResult.error;
        }

        if (subscriptionPlansResult.error) {
          console.error('❌ Error fetching subscription plans:', subscriptionPlansResult.error);
          throw subscriptionPlansResult.error;
        }

        const profiles = profilesResult.data || [];
        const subscribers = subscribersResult.data || [];
        const subscriptionPlans = subscriptionPlansResult.data || [];

        console.log('✅ Fetched profiles:', profiles.length, 'subscribers:', subscribers.length);

        // Calculate current month start
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Basic metrics
        const totalCustomers = profiles.length;
        const activeSubscriptions = subscribers.filter(sub => sub.subscribed).length;

        // Calculate new customers this month
        const newCustomersThisMonth = profiles.filter(profile => 
          new Date(profile.created_at) >= monthStart
        ).length;

        // Get plan pricing from subscription plans
        const premiumPlan = subscriptionPlans.find(plan => 
          plan.name.toLowerCase().includes('premium') || 
          plan.name.toLowerCase().includes('protection')
        );
        const familyPlan = subscriptionPlans.find(plan => 
          plan.name.toLowerCase().includes('family') || 
          plan.name.toLowerCase().includes('connection')
        );
        
        // Calculate subscription tiers using actual plan names
        const premiumSubscriptions = subscribers.filter(sub => 
          sub.subscribed && premiumPlan && sub.subscription_tier === premiumPlan.name
        ).length;
        
        // Regional/Call Centre subscriptions - for profiles with subscription_regional = true
        const callCentreSubscriptions = subscribers.filter(sub => 
          sub.subscribed && (
            sub.subscription_tier?.toLowerCase().includes('regional') ||
            sub.subscription_tier?.toLowerCase().includes('call') ||
            sub.subscription_tier?.toLowerCase().includes('centre') ||
            sub.subscription_tier?.toLowerCase().includes('center')
          )
        ).length;

        // Revenue calculation using actual plan prices
        const premiumPrice = premiumPlan?.price || 9.99;
        const regionalPrice = 24.99; // Regional pricing for call centre services
        const familyPrice = familyPlan?.price || 2.99;
        
        // Calculate family plan subscriptions
        const familySubscriptions = subscribers.filter(sub => 
          sub.subscribed && familyPlan && sub.subscription_tier === familyPlan.name
        ).length;
        
        const totalRevenue = (premiumSubscriptions * premiumPrice) + 
                           (callCentreSubscriptions * regionalPrice) + 
                           (familySubscriptions * familyPrice);

        // Calculate subscription status breakdown based on subscribed field only (simpler logic)
        const activeSubscribersCount = subscribers.filter(sub => sub.subscribed).length;
        const inactiveSubscribersCount = subscribers.filter(sub => !sub.subscribed).length;
        const cancelledSubscribersCount = 0; // Will be calculated when we have proper status tracking
        const expiredSubscribersCount = 0; // Will be calculated when we have proper status tracking

        // Calculate derived metrics
        const averageRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        const subscriptionConversionRate = totalCustomers > 0 ? (activeSubscriptions / totalCustomers) * 100 : 0;

        console.log('📊 Calculated metrics:', {
          totalCustomers,
          newCustomersThisMonth,
          activeSubscriptions,
          premiumSubscriptions,
          callCentreSubscriptions,
          totalRevenue,
          subscriptionStatusBreakdown: {
            active: activeSubscribersCount,
            inactive: inactiveSubscribersCount, 
            cancelled: cancelledSubscribersCount,
            expired: expiredSubscribersCount
          }
        });

        return {
          totalCustomers,
          newCustomersThisMonth,
          activeSubscriptions,
          totalRevenue,
          premiumSubscriptions,
          callCentreSubscriptions,
          averageRevenuePerCustomer,
          subscriptionConversionRate,
          premiumPlanPrice: premiumPrice,
          subscriptionStatusBreakdown: {
            active: activeSubscribersCount,
            inactive: inactiveSubscribersCount,
            cancelled: cancelledSubscribersCount,
            expired: expiredSubscribersCount
          }
        };
      } catch (error) {
        console.error('❌ Error in useRealTimeCustomerData:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    console.log('🔔 Setting up real-time subscriptions for customer data...');
    
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        console.log('📊 Profiles table changed, invalidating customer data...');
        query.refetch();
      })
      .subscribe();

    const subscribersChannel = supabase
      .channel('subscribers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscribers'
      }, () => {
        console.log('💰 Subscribers table changed, invalidating customer data...');
        query.refetch();
      })
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up real-time subscriptions...');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscribersChannel);
    };
  }, [query]);

  return query;
}