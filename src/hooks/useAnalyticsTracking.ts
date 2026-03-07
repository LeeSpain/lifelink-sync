import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedUserRole } from './useOptimizedData';
import { 
  trackEvent, 
  trackEmergencyEvent, 
  trackSubscriptionEvent, 
  trackUserInteraction,
  setUserProperties 
} from '@/lib/analytics';

export function useAnalyticsTracking() {
  const { user } = useAuth();
  const { data: role } = useOptimizedUserRole();

  // Set user properties when user data is available
  useEffect(() => {
    if (user && role) {
      setUserProperties(user.id, {
        role,
        email: user.email,
        created_at: user.created_at
      });
    }
  }, [user, role]);

  const trackCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
    trackEvent(eventName, {
      user_id: user?.id,
      user_role: role,
      timestamp: Date.now(),
      ...parameters
    });
  };

  const trackEmergency = (action: string, details?: Record<string, any>) => {
    trackEmergencyEvent(action, {
      user_id: user?.id,
      timestamp: Date.now(),
      ...details
    });
  };

  const trackSubscription = (action: string, planType?: string, value?: number) => {
    trackSubscriptionEvent(action, planType, value);
  };

  const trackInteraction = (element: string, action: string, location?: string) => {
    trackUserInteraction(element, action, location);
  };

  const trackFormSubmission = (formName: string, success: boolean, errors?: string[]) => {
    trackCustomEvent('form_submission', {
      category: 'form',
      form_name: formName,
      success,
      errors: errors?.join(', '),
      action: success ? 'completed' : 'failed'
    });
  };

  const trackRegistration = (method: string, subscriptionPlan?: string) => {
    trackCustomEvent('sign_up', {
      category: 'auth',
      method,
      subscription_plan: subscriptionPlan,
      action: 'registration_completed'
    });
  };

  const trackLogin = (method: string) => {
    trackCustomEvent('login', {
      category: 'auth',
      method,
      action: 'login_completed'
    });
  };

  const trackChatInteraction = (action: string, context?: string) => {
    trackCustomEvent('chat_interaction', {
      category: 'engagement',
      action,
      context,
      chat_type: 'clara_ai'
    });
  };

  return {
    trackCustomEvent,
    trackEmergency,
    trackSubscription,
    trackInteraction,
    trackFormSubmission,
    trackRegistration,
    trackLogin,
    trackChatInteraction
  };
}