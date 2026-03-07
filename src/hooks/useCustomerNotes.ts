import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCustomerNotes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addNote = useMutation({
    mutationFn: async ({ 
      customerId, 
      noteText, 
      isImportant = false 
    }: { 
      customerId: string; 
      noteText: string; 
      isImportant?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          created_by: user.id,
          note_text: noteText,
          is_important: isImportant,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({ title: 'Note added successfully' });
      queryClient.invalidateQueries({ queryKey: ['customer-activity', variables.customerId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async ({ noteId, customerId }: { noteId: string; customerId: string }) => {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return { noteId, customerId };
    },
    onSuccess: (data) => {
      toast({ title: 'Note deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['customer-activity', data.customerId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    addNote,
    deleteNote,
  };
};