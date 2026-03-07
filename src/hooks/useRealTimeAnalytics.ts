import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useSessionMetrics } from './useEnhancedAnalytics';
// Removed circular import - useFamilyAnalytics should be imported directly where needed

export interface RealTimeMetrics {
  totalUsers: number;
  totalContacts: number;
  contactsLast30Days: number;
  totalOrders: number;
  totalRevenue: number;
  totalRegistrations: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  // Family system metrics
  familyConnections: number;
  activeSosEvents: number;
  familyRevenue: number;
  // Subscription metrics
  totalSubscriptions: number;
  subscriptionRevenue: number;
  monthlyRecurringRevenue: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface DeviceData {
  device: string;
  sessions: number;
  percentage: number;
}

export interface TopPage {
  page: string;
  views: number;
  percentage: number;
}

export interface CustomEvent {
  event: string;
  count: number;
  trend: string;
}

// Hook to fetch real-time analytics data
export function useRealTimeAnalytics() {
  const { data: sessionMetrics } = useSessionMetrics();
  
  return useQuery({
    queryKey: ['real-time-analytics'],
    queryFn: async (): Promise<RealTimeMetrics> => {
      try {
        // Get real data from database with error handling
        const [ordersResult, profilesResult, subscribersResult, subscriptionPlansResult] = await Promise.allSettled([
          supabase.from('orders').select('total_price').eq('status', 'completed'),
          supabase.from('profiles').select('count', { count: 'exact', head: true }),
          supabase.from('subscribers').select('subscription_tier, subscribed, created_at').eq('subscribed', true),
          supabase.from('subscription_plans').select('name, price, billing_interval').eq('is_active', true)
        ]);

        // Get actual user count from profiles
        const profilesCount = profilesResult.status === 'fulfilled' ? profilesResult.value.count : 1;
        const totalUsers = (typeof profilesCount === 'number') ? profilesCount : 1;
        
        // Get contact count from communication_preferences table as a proxy
        const { count: contactsCount } = await supabase
          .from('communication_preferences')
          .select('count', { count: 'exact', head: true });
        const totalContacts = (typeof contactsCount === 'number') ? contactsCount : 0;
        
        // For contacts last 30 days, calculate from recent communication preferences
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const { count: recentContactsCount } = await supabase
          .from('communication_preferences')
          .select('count', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());
        const contactsLast30Days = (typeof recentContactsCount === 'number') ? recentContactsCount : 0;

        const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.data || []) : [];
        const totalOrders = orders.length;
        const orderRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price?.toString() || '0') || 0), 0);
        
        // Get registration count from profiles table
        const totalRegistrations = totalUsers; // All profiles represent registrations

        // Process subscription data with real pricing
        const subscribers = subscribersResult.status === 'fulfilled' ? (subscribersResult.value.data || []) : [];
        const subscriptionPlans = subscriptionPlansResult.status === 'fulfilled' ? (subscriptionPlansResult.value.data || []) : [];
        
        // Create pricing map from actual subscription plans
        const planPriceMap = new Map();
        subscriptionPlans.forEach(plan => {
          planPriceMap.set(plan.name, {
            price: parseFloat(plan.price?.toString() || '0'),
            interval: plan.billing_interval
          });
        });

        console.info('Active subscribers:', subscribers);
        console.info('Plan price map:', planPriceMap);

        // Calculate subscription metrics using real pricing
        const totalSubscriptions = subscribers.length;
        let monthlyRecurringRevenue = 0;
        
        subscribers.forEach(subscriber => {
          const plan = planPriceMap.get(subscriber.subscription_tier);
          if (plan) {
            console.info(`Processing subscriber with tier ${subscriber.subscription_tier}, plan:`, plan);
            console.info(`Adding ${plan.price} to MRR`);
            monthlyRecurringRevenue += plan.price;
          }
        });
        
        console.info('Calculated MRR:', monthlyRecurringRevenue);
        
        // For total subscription revenue, use MRR as the primary revenue source
        const subscriptionRevenue = monthlyRecurringRevenue;
        
        // Total revenue combines orders and subscriptions
        const totalRevenue = orderRevenue + subscriptionRevenue;

        // Calculate conversion rate (registrations / total users)
        const conversionRate = totalUsers > 0 ? (totalRegistrations / totalUsers) * 100 : 0;

        console.info('Final Revenue Calculation:', {
          orderRevenue,
          subscriptionRevenue,
          totalRevenue,
          subscriberCount: subscribers.length,
          planPriceMap: Object.fromEntries(planPriceMap)
        });

        return {
          totalUsers,
          totalContacts,
          contactsLast30Days,
          totalOrders,
          totalRevenue,
          totalRegistrations,
          bounceRate: sessionMetrics?.bounceRate || 0,
          avgSessionDuration: sessionMetrics?.avgSessionDuration || 0,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          // Family system metrics - set to 0 since we removed the circular dependency
          familyConnections: 0,
          activeSosEvents: 0,
          familyRevenue: 0,
          // Subscription metrics
          totalSubscriptions,
          subscriptionRevenue,
          monthlyRecurringRevenue
        };
      } catch (error) {
        console.error('Error fetching real-time analytics:', error);
        return {
          totalUsers: 0,
          totalContacts: 0,
          contactsLast30Days: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalRegistrations: 0,
          bounceRate: 0,
          avgSessionDuration: 0,
          conversionRate: 0,
          familyConnections: 0,
          activeSosEvents: 0,
          familyRevenue: 0,
          totalSubscriptions: 0,
          subscriptionRevenue: 0,
          monthlyRecurringRevenue: 0
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false,
  });
}

// Hook for Lovable analytics data - now fetches REAL page view data only
export function useLovableAnalytics() {
  return useQuery({
    queryKey: ['lovable-analytics'],
    queryFn: async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Use aggregate COUNT to avoid the 1,000-row cap
        const { count: pageViewCount, error: pageViewCountError } = await supabase
          .from('homepage_analytics')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (pageViewCountError) {
          console.error('Database error (page view count):', pageViewCountError);
          throw pageViewCountError;
        }

        // Fetch session_ids in a wide range to compute unique visitors client-side
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('homepage_analytics')
          .select('session_id')
          .eq('event_type', 'page_view')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .not('session_id', 'is', null)
          .order('session_id', { ascending: true })
          .range(0, 49999);

        if (sessionsError) {
          console.error('Database error (sessions fetch):', sessionsError);
          throw sessionsError;
        }

        const actualPageViews = typeof pageViewCount === 'number' ? pageViewCount : 0;
        const actualUniqueVisitors = new Set((sessionsData || []).map(item => item.session_id)).size;
        const actualSessions = actualUniqueVisitors;

        console.log('📊 FRESH Analytics Data (aggregated):', {
          actualPageViews,
          actualUniqueVisitors,
          actualSessions,
          sessionsFetched: sessionsData?.length || 0,
          timestamp: new Date().toISOString(),
        });

        return {
          pageViews: actualPageViews,
          uniqueVisitors: actualUniqueVisitors,
          sessions: actualSessions
        };
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        return {
          pageViews: 0,
          uniqueVisitors: 0,
          sessions: 0
        };
      }
    },
    staleTime: 0, // Force immediate refetch
    gcTime: 0, // No caching
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for testing
    refetchIntervalInBackground: false,
  });
}

// Hook for real-time traffic sources - now deprecated, use useEnhancedTrafficSources
export function useTrafficSources(): TrafficSource[] {
  return [
    { source: 'Direct', visitors: 0, percentage: 0 },
    { source: 'Organic Search', visitors: 0, percentage: 0 },
    { source: 'Social Media', visitors: 0, percentage: 0 },
    { source: 'Referral', visitors: 0, percentage: 0 }
  ];
}

// Enhanced Traffic Sources with real data - REMOVED - use useEnhancedAnalytics.ts instead

// Hook for device data - now deprecated, use useEnhancedDeviceData
export function useDeviceData(): DeviceData[] {
  return [
    { device: 'Mobile', sessions: 0, percentage: 0 },
    { device: 'Desktop', sessions: 0, percentage: 0 },
    { device: 'Tablet', sessions: 0, percentage: 0 }
  ];
}

// Enhanced Device Data with real data - REMOVED - use useEnhancedAnalytics.ts instead

// Hook for top pages with real data
export function useTopPages() {
  return useQuery({
    queryKey: ['top-pages'],
    queryFn: async (): Promise<TopPage[]> => {
      try {
        // Get page view data from homepage_analytics table
        const { data: pageData, error } = await supabase
          .from('homepage_analytics')
          .select('event_data, page_context')
          .eq('event_type', 'page_view')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .range(0, 99999);

        if (error) throw error;

        // Group by page and count views
        const pageViews: Record<string, number> = {};
        pageData?.forEach(item => {
          const page = item.page_context || '/';
          pageViews[page] = (pageViews[page] || 0) + 1;
        });

        const totalViews = Object.values(pageViews).reduce((sum, views) => sum + views, 0);
        
        return Object.entries(pageViews)
          .map(([page, views]) => ({
            page,
            views,
            percentage: totalViews > 0 ? parseFloat(((views / totalViews) * 100).toFixed(1)) : 0
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);
      } catch (error) {
        console.error('Error fetching top pages:', error);
        return [
          { page: '/', views: 0, percentage: 0 },
          { page: '/register', views: 0, percentage: 0 },
          { page: '/auth', views: 0, percentage: 0 },
          { page: '/support', views: 0, percentage: 0 },
          { page: '/contact', views: 0, percentage: 0 }
        ];
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false,
  });
}

// Hook for custom events with real data
export function useCustomEvents() {
  return useQuery({
    queryKey: ['custom-events'],
    queryFn: async (): Promise<CustomEvent[]> => {
      try {
        // Get custom events from homepage_analytics table
        const { data: eventData, error } = await supabase
          .from('homepage_analytics')
          .select('event_type, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .range(0, 99999);

        if (error) throw error;

        // Count events by type
        const eventCounts: Record<string, number> = {
          'Emergency SOS Button Clicked': 0,
          'Registration Completed': 0,
          'Subscription Purchased': 0,
          'Clara Chat Interaction': 0,
          'Family Member Invited': 0
        };

        eventData?.forEach(item => {
          switch (item.event_type) {
            case 'sos_button_click':
              eventCounts['Emergency SOS Button Clicked']++;
              break;
            case 'registration_completed':
              eventCounts['Registration Completed']++;
              break;
            case 'subscription_purchased':
              eventCounts['Subscription Purchased']++;
              break;
            case 'chat_interaction':
              eventCounts['Clara Chat Interaction']++;
              break;
            case 'family_invite':
              eventCounts['Family Member Invited']++;
              break;
          }
        });

        return Object.entries(eventCounts).map(([event, count]) => ({
          event,
          count,
          trend: count > 0 ? '+0.0%' : '0.0%' // Placeholder until we have historical data for trends
        }));
      } catch (error) {
        console.error('Error fetching custom events:', error);
        return [
          { event: 'Emergency SOS Button Clicked', count: 0, trend: '0.0%' },
          { event: 'Registration Completed', count: 0, trend: '0.0%' },
          { event: 'Subscription Purchased', count: 0, trend: '0.0%' },
          { event: 'Clara Chat Interaction', count: 0, trend: '0.0%' },
          { event: 'Family Member Invited', count: 0, trend: '0.0%' }
        ];
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false,
  });
}

// Hook for real-time active users with real data
export function useRealTimeActiveUsers() {
  return useQuery({
    queryKey: ['real-time-active-users'],
    queryFn: async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Get active sessions in the last hour
        const { data: recentActivity, error } = await supabase
          .from('homepage_analytics')
          .select('session_id, page_context, created_at')
          .gte('created_at', oneHourAgo.toISOString())
          .range(0, 99999)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Count unique active users
        const uniqueSessions = new Set(recentActivity?.map(item => item.session_id) || []);
        const activeUsers = uniqueSessions.size;

        // Count page views in the last hour
        const pageViewsLastHour = recentActivity?.filter(item => 
          new Date(item.created_at) >= oneHourAgo
        ).length || 0;

        // Get top active pages
        const pageActivity: Record<string, number> = {};
        recentActivity?.forEach(item => {
          const page = item.page_context || '/';
          pageActivity[page] = (pageActivity[page] || 0) + 1;
        });

        const topActivePages = Object.entries(pageActivity)
          .map(([page, users]) => ({ page, users }))
          .sort((a, b) => b.users - a.users)
          .slice(0, 4);

        return {
          activeUsers,
          pageViewsLastHour,
          topActivePages
        };
      } catch (error) {
        console.error('Error fetching real-time active users:', error);
        return {
          activeUsers: 0,
          pageViewsLastHour: 0,
          topActivePages: [
            { page: '/', users: 0 },
            { page: '/register', users: 0 },
            { page: '/member-dashboard', users: 0 },
            { page: '/contact', users: 0 }
          ]
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false,
  });
}