import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedSubscription } from './useOptimizedSubscription';
import { useOptimizedUserRole } from './useOptimizedData';
import { useConnections } from './useConnections';

// Centralized dashboard data fetching with parallel queries
export function useDashboardData() {
  const { user } = useAuth();
  
  // Fetch all dashboard data in parallel
  const subscriptionQuery = useOptimizedSubscription();
  const roleQuery = useOptimizedUserRole();
  const connectionsQuery = useConnections();

  // Dashboard-specific data that depends on user
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'summary', user?.id],
    queryFn: async () => {
      // This could fetch dashboard-specific metrics
      // For now, return basic structure
      return {
        metrics: {
          totalConnections: 0,
          emergencyContacts: 0,
          lastActivity: null,
        }
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = subscriptionQuery.isLoading || 
                   roleQuery.isLoading || 
                   connectionsQuery.isLoading ||
                   dashboardQuery.isLoading;

  const hasError = subscriptionQuery.error || 
                   roleQuery.error || 
                   connectionsQuery.error ||
                   dashboardQuery.error;

  return {
    subscription: subscriptionQuery.data,
    role: roleQuery.data,
    connections: connectionsQuery.data,
    dashboard: dashboardQuery.data,
    isLoading,
    hasError,
    // Individual loading states for progressive rendering
    loadingStates: {
      subscription: subscriptionQuery.isLoading,
      role: roleQuery.isLoading,
      connections: connectionsQuery.isLoading,
      dashboard: dashboardQuery.isLoading,
    }
  };
}