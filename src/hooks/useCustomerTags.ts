import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCustomerTags = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allTags = [] } = useQuery({
    queryKey: ['customer-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const getCustomerTags = (customerId: string) => {
    return useQuery({
      queryKey: ['customer-tag-assignments', customerId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('customer_tag_assignments')
          .select('*, customer_tags(*)')
          .eq('customer_id', customerId);

        if (error) throw error;
        return data || [];
      },
      enabled: !!customerId,
    });
  };

  const assignTag = useMutation({
    mutationFn: async ({ customerId, tagId }: { customerId: string; tagId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_tag_assignments')
        .insert({
          customer_id: customerId,
          tag_id: tagId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({ title: 'Tag assigned successfully' });
      queryClient.invalidateQueries({ queryKey: ['customer-tag-assignments', variables.customerId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to assign tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeTag = useMutation({
    mutationFn: async ({ customerId, tagId }: { customerId: string; tagId: string }) => {
      const { error } = await supabase
        .from('customer_tag_assignments')
        .delete()
        .eq('customer_id', customerId)
        .eq('tag_id', tagId);

      if (error) throw error;
      return { customerId, tagId };
    },
    onSuccess: (data) => {
      toast({ title: 'Tag removed successfully' });
      queryClient.invalidateQueries({ queryKey: ['customer-tag-assignments', data.customerId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('customer_tags')
        .insert({ name, color })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Tag created successfully' });
      queryClient.invalidateQueries({ queryKey: ['customer-tags'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    allTags,
    getCustomerTags,
    assignTag,
    removeTag,
    createTag,
  };
};