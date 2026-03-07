import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRealTimeUpdatesProps {
  onSubscriptionUpdate?: () => void;
  onFamilyUpdate?: () => void;
  onOrderUpdate?: () => void;
}

export function useRealTimeUpdates({
  onSubscriptionUpdate,
  onFamilyUpdate,
  onOrderUpdate
}: UseRealTimeUpdatesProps = {}) {
  const { toast } = useToast();

  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      // User returned to tab, refresh data
      onSubscriptionUpdate?.();
      onFamilyUpdate?.();
      onOrderUpdate?.();
    }
  }, [onSubscriptionUpdate, onFamilyUpdate, onOrderUpdate]);

  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (e.key === 'subscription-updated') {
      onSubscriptionUpdate?.();
      toast({
        title: "Subscription Updated",
        description: "Your subscription status has been updated.",
      });
    }
    if (e.key === 'family-invite-paid') {
      onFamilyUpdate?.();
      toast({
        title: "Family Member Joined",
        description: "A family member has completed their payment and joined your group.",
      });
    }
    if (e.key === 'order-completed') {
      onOrderUpdate?.();
      toast({
        title: "Purchase Completed",
        description: "Your purchase has been completed successfully.",
      });
    }
  }, [onSubscriptionUpdate, onFamilyUpdate, onOrderUpdate, toast]);

  const triggerRefresh = useCallback((type: 'subscription' | 'family' | 'order') => {
    localStorage.setItem(`${type}-updated`, Date.now().toString());
    localStorage.removeItem(`${type}-updated`);
  }, []);

  useEffect(() => {
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events
    const handleCustomUpdate = (e: CustomEvent) => {
      const { type } = e.detail;
      switch (type) {
        case 'subscription':
          onSubscriptionUpdate?.();
          break;
        case 'family':
          onFamilyUpdate?.();
          break;
        case 'order':
          onOrderUpdate?.();
          break;
      }
    };

    window.addEventListener('data-updated', handleCustomUpdate as EventListener);

    // Setup real-time subscriptions
    let subscription: any = null;
    
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscribers',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            onSubscriptionUpdate?.();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'family_invites',
            filter: `inviter_user_id=eq.${user.id}`
          },
          () => {
            onFamilyUpdate?.();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            onOrderUpdate?.();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('data-updated', handleCustomUpdate as EventListener);
      
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [handleVisibilityChange, handleStorageChange, onSubscriptionUpdate, onFamilyUpdate, onOrderUpdate]);

  return { triggerRefresh };
}