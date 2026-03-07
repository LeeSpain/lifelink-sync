import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Query Keys
export const QUERY_KEYS = {
  user: ['user'] as const,
  userRole: ['user', 'role'] as const,
  subscriptionPlans: ['subscription-plans'] as const,
  products: ['products'] as const,
  subscribers: ['subscribers'] as const,
  orders: ['orders'] as const,
  userActivity: (userId: string) => ['user-activity', userId] as const,
  customers: ['customers'] as const,
  revenue: ['revenue'] as const,
  userGrowth: ['user-growth'] as const,
} as const;

// Optimized data fetching hooks
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionPlans,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - plans don't change often
  });
}

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSubscribers() {
  return useQuery({
    queryKey: QUERY_KEYS.subscribers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - more dynamic data
  });
}

export function useOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserActivity(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userActivity(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Fix for customers query with proper profile data
export function useCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.customers,
    queryFn: async () => {
      // Fetch profiles and subscribers separately to avoid relationship errors
      const [profilesResult, subscribersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('subscribers')
          .select('*')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (subscribersResult.error) throw subscribersResult.error;

      const profiles = profilesResult.data || [];
      const subscribers = subscribersResult.data || [];

      // Manually join the data
      const customers = profiles.map(profile => {
        const subscriber = subscribers.find(s => s.user_id === profile.user_id);
        return {
          ...profile,
          subscriber
        };
      });

      return customers;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Optimized user role hook - Fixed to prevent authentication loops
export function useOptimizedUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: QUERY_KEYS.userRole,
    queryFn: async () => {
      if (!user?.id) {
        console.log('🔧 useOptimizedUserRole: No user ID available');
        return null;
      }
      
      console.log('🔧 useOptimizedUserRole: Fetching role for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('🔧 useOptimizedUserRole: Error fetching role:', error);
        throw error;
      }
      
      const role = data?.role || 'user';
      console.log('🔧 useOptimizedUserRole: Retrieved role:', role);
      return role;
    },
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes - much longer to prevent re-fetching
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount to prevent loops
    refetchOnReconnect: false, // Don't refetch on network reconnect
    retry: 1, // Reduce retries to prevent loops
  });
}

// Batch mutation for bulk operations
export function useBulkUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Array<{ table: string; id: string; data: any }>) => {
      const results = await Promise.allSettled(
        updates.map(async (update) => {
          // Use type assertion to handle dynamic table names
          const query = supabase.from(update.table as any);
          return query.update(update.data).eq('id', update.id);
        })
      );
      
      return results;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
    },
  });
}