import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
}

export const useEmergencyContacts = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchEmergencyContacts();
  }, [user]);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    contacts,
    loading,
    refetch: fetchEmergencyContacts
  };
};