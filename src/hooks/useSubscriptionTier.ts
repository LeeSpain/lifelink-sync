import { useOptimizedSubscription } from './useOptimizedSubscription';

export type SubscriptionTier = 'basic' | 'call_centre' | null;

interface SubscriptionData {
  tier: SubscriptionTier;
  isCallCentreEnabled: boolean;
  loading: boolean;
}

export const useSubscriptionTier = (): SubscriptionData => {
  const { data: subscriptionData, isLoading } = useOptimizedSubscription();
  
  // Map subscription data to tier
  const tier: SubscriptionTier = subscriptionData?.subscribed 
    ? (subscriptionData.subscription_tier as SubscriptionTier) || 'basic'
    : 'basic';

  return {
    tier,
    isCallCentreEnabled: tier === 'call_centre',
    loading: isLoading
  };
};