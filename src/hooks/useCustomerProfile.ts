import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerProfile {
  // Profile data
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  country?: string;
  country_code?: string;
  address?: string;
  language_preference?: string;
  medical_conditions?: string[];
  allergies?: string[];
  medications?: string[];
  blood_type?: string;
  profile_completion_percentage?: number;
  location_sharing_enabled?: boolean;
  subscription_regional?: boolean;
  has_spain_call_center?: boolean;
  call_center_number?: string;
  emergency_numbers?: string[];
  role?: string;
  created_at: string;
  updated_at: string;
  
  // Subscription data
  subscriber?: {
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
    email?: string;
    stripe_customer_id?: string;
  };
  
  // Emergency contacts
  emergency_contacts?: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    relationship?: string;
    priority: number;
    type: string;
  }>;
  
  // Connections
  connections?: Array<{
    id: string;
    type: string;
    status: string;
    relationship?: string;
    invite_email?: string;
    escalation_priority?: number;
    accepted_at?: string;
    invited_at?: string;
    contact_user_id?: string;
  }>;
}

export function useCustomerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['customer-profile', userId],
    queryFn: async (): Promise<CustomerProfile | null> => {
      if (!userId) return null;

      console.log('🔄 Fetching customer profile for:', userId);
      
      // Fetch profile, subscriber, emergency contacts, and connections in parallel
      const [profileResult, subscriberResult, contactsResult, connectionsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        
        supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        
        supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', userId)
          .order('priority', { ascending: true }),
        
        supabase
          .from('connections')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (profileResult.error) {
        console.error('❌ Error fetching profile:', profileResult.error);
        throw profileResult.error;
      }

      const profile = profileResult.data;
      const subscriber = subscriberResult.data;
      const emergencyContacts = contactsResult.data || [];
      const connections = connectionsResult.data || [];

      // Get email from subscriber if available
      const email = subscriber?.email;

      console.log('✅ Customer profile loaded:', {
        userId,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`,
        hasSubscriber: !!subscriber,
        emergencyContactsCount: emergencyContacts.length,
        connectionsCount: connections.length
      });

      return {
        ...profile,
        email,
        subscriber: subscriber ? {
          subscribed: subscriber.subscribed,
          subscription_tier: subscriber.subscription_tier,
          subscription_end: subscriber.subscription_end,
          email: subscriber.email,
          stripe_customer_id: subscriber.stripe_customer_id
        } : undefined,
        emergency_contacts: emergencyContacts,
        connections
      };
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
    retry: 2
  });
}
