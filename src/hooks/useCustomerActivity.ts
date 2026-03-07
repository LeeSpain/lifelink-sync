import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  category: string;
  title: string;
  description: string;
  metadata?: any;
  user?: string;
}

interface UseCustomerActivityParams {
  customerId: string;
  limit?: number;
  offset?: number;
  category?: string;
}

export const useCustomerActivity = ({ 
  customerId, 
  limit = 50, 
  offset = 0, 
  category = 'all' 
}: UseCustomerActivityParams) => {
  return useQuery({
    queryKey: ['customer-activity', customerId, limit, offset, category],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-customer-activity', {
        body: { customerId, limit, offset, category },
      });

      if (error) throw error;
      return data as {
        activities: ActivityItem[];
        total: number;
        hasMore: boolean;
      };
    },
    enabled: !!customerId,
    staleTime: 30 * 1000, // 30 seconds
  });
};