import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContactData {
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  priority: number;
  type: string;
}

export function useEmergencyContactManagement(userId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createContact = useMutation({
    mutationFn: async (data: EmergencyContactData) => {
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: userId,
          ...data
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Emergency contact added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmergencyContactData> }) => {
      const { error } = await supabase
        .from('emergency_contacts')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Emergency contact updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Emergency contact deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    createContact: createContact.mutate,
    updateContact: updateContact.mutate,
    deleteContact: deleteContact.mutate,
    isCreating: createContact.isPending,
    isUpdating: updateContact.isPending,
    isDeleting: deleteContact.isPending
  };
}
