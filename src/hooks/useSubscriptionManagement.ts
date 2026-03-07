import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionActionParams {
  userId: string;
  action: 'extend' | 'upgrade' | 'downgrade' | 'cancel' | 'activate';
  newTier?: string;
  extensionDays?: number;
  reason?: string;
}

export function useSubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const manageSubscription = useMutation({
    mutationFn: async (params: SubscriptionActionParams) => {
      const { data, error } = await supabase.functions.invoke('manage-customer-subscription', {
        body: params
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to manage subscription');

      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success',
        description: data.message || 'Subscription updated successfully'
      });

      // Invalidate customer profile to refresh data
      queryClient.invalidateQueries({ queryKey: ['customer-profile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-customers'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  });

  return {
    manageSubscription: manageSubscription.mutate,
    isManaging: manageSubscription.isPending
  };
}
