import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateOrderParams {
  userId: string;
  productId: string;
  quantity: number;
  priceOverride?: number;
  paymentMethod: 'manual' | 'stripe' | 'free';
  status: 'pending' | 'processing' | 'completed' | 'delivered' | 'cancelled';
  notes?: string;
}

interface UpdateOrderStatusParams {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'delivered' | 'cancelled' | 'refunded';
  notes?: string;
}

export function useCustomerProducts(userId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer orders with product details
  const ordersQuery = useQuery({
    queryKey: ['customer-orders', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  // Fetch available products for assignment
  // @ts-ignore - Supabase type inference issue
  const productsQuery = useQuery({
    queryKey: ['available-products'],
    queryFn: async () => {
      // @ts-ignore
      const response = await supabase.from('products').select('id, name, sku, price').eq('is_active', true).order('name');
      if (response.error) throw response.error;
      return response.data || [];
    },
    staleTime: 60000,
  });

  // Create new order
  const createOrder = useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const { data: result, error } = await supabase.functions.invoke('assign-customer-product', {
        body: {
          action: 'create_order',
          ...params,
        },
      });

      if (error) throw error;
      const responseData = result as { success: boolean; error?: string };
      if (!responseData.success) throw new Error(responseData.error || 'Failed to create order');
      return responseData;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Product assigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-orders', userId] });
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

  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async (params: UpdateOrderStatusParams) => {
      const { data: result, error } = await supabase.functions.invoke('assign-customer-product', {
        body: {
          action: 'update_order_status',
          ...params,
        },
      });

      if (error) throw error;
      const responseData = result as { success: boolean; error?: string };
      if (!responseData.success) throw new Error(responseData.error || 'Failed to update order');
      return responseData;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Order status updated',
      });
      queryClient.invalidateQueries({ queryKey: ['customer-orders', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const orders = ordersQuery.data || [];
  const availableProducts = productsQuery.data || [];

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum: number, order: any) => sum + (Number(order.total_price) || 0), 0),
    averageOrderValue: orders.length 
      ? orders.reduce((sum: number, order: any) => sum + (Number(order.total_price) || 0), 0) / orders.length
      : 0,
    lastPurchaseDate: orders[0]?.created_at || null,
  };

  return {
    orders,
    availableProducts,
    isLoading: ordersQuery.isLoading,
    stats,
    createOrder: createOrder.mutate,
    updateOrderStatus: updateOrderStatus.mutate,
    isCreating: createOrder.isPending,
    isUpdating: updateOrderStatus.isPending,
  };
}
