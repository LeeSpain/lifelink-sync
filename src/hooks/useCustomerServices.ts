import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssignServiceParams {
  customerId: string;
  serviceId: string;
  startDate?: string;
  endDate?: string;
  priceOverride?: number;
  autoRenew?: boolean;
  notes?: string;
}

interface UpdateServiceParams {
  assignmentId: string;
  status?: 'active' | 'inactive' | 'pending';
  endDate?: string;
  priceOverride?: number;
  autoRenew?: boolean;
  notes?: string;
}

export function useCustomerServices(userId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer's assigned services
  const { data: assignedServices, isLoading } = useQuery({
    queryKey: ['customer-services', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('customer_regional_services')
        .select(`
          *,
          regional_services (
            id,
            name,
            region,
            price,
            features
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  // Fetch available regional services
  const { data: availableServices } = useQuery({
    queryKey: ['available-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // Assign service to customer
  const assignService = useMutation({
    mutationFn: async (params: AssignServiceParams) => {
      const { data: result, error } = await supabase.functions.invoke('assign-customer-service', {
        body: {
          action: 'assign_service',
          ...params,
        },
      });

      if (error) throw error;
      const responseData = result as { success: boolean; error?: string };
      if (!responseData.success) throw new Error(responseData.error || 'Failed to assign service');
      return responseData;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Service assigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-services', userId] });
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update service assignment
  const updateService = useMutation({
    mutationFn: async (params: UpdateServiceParams) => {
      const { data: result, error } = await supabase.functions.invoke('assign-customer-service', {
        body: {
          action: 'update_service',
          ...params,
        },
      });

      if (error) throw error;
      const responseData = result as { success: boolean; error?: string };
      if (!responseData.success) throw new Error(responseData.error || 'Failed to update service');
      return responseData;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-services', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate statistics
  const stats = {
    totalServices: assignedServices?.length || 0,
    activeServices: assignedServices?.filter(s => s.status === 'active').length || 0,
    monthlyRevenue: assignedServices
      ?.filter(s => s.status === 'active')
      .reduce((sum, service) => {
        const price = service.price_override || service.regional_services?.price || 0;
        return sum + Number(price);
      }, 0) || 0,
  };

  return {
    assignedServices,
    availableServices,
    isLoading,
    stats,
    assignService: assignService.mutate,
    updateService: updateService.mutate,
    isAssigning: assignService.isPending,
    isUpdating: updateService.isPending,
  };
}
