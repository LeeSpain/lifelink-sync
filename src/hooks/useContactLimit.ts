import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedSubscription } from '@/hooks/useOptimizedSubscription';

interface ContactLimit {
  maxContacts: number;
  currentCount: number;
  canAddMore: boolean;
  isTrial: boolean;
  remaining: number;
}

export function useContactLimit() {
  const { user } = useAuth();
  const { data: subscription } = useOptimizedSubscription();
  const [currentCount, setCurrentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isPaid = subscription?.subscribed === true && !subscription?.is_trialing;
  const maxContacts = isPaid ? 5 : 1;

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchCount() {
      try {
        const { count } = await supabase
          .from('emergency_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id);

        setCurrentCount(count || 0);
      } catch (err) {
        console.error('Failed to fetch contact count:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCount();
  }, [user?.id]);

  const remaining = Math.max(0, maxContacts - currentCount);

  return {
    maxContacts,
    currentCount,
    canAddMore: currentCount < maxContacts,
    isTrial: !isPaid,
    remaining,
    loading,
    refetchCount: async () => {
      if (!user?.id) return;
      const { count } = await supabase
        .from('emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setCurrentCount(count || 0);
    }
  };
}
