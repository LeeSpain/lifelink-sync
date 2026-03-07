import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EmergencyConference, ConferenceParticipant, ConferenceStatus } from '@/types/conference';

interface UseEmergencyConferenceOptions {
  incidentId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useEmergencyConference = (options: UseEmergencyConferenceOptions = {}) => {
  const { incidentId, autoRefresh = true, refreshInterval = 3000 } = options;
  const [conferenceStatus, setConferenceStatus] = useState<ConferenceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConferenceStatus = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch conference data
      const { data: conference, error: confError } = await supabase
        .from('emergency_conferences')
        .select('*')
        .eq('incident_id', id)
        .single();

      if (confError) throw confError;
      if (!conference) throw new Error('Conference not found');

      // Fetch participants
      const { data: participants, error: partError } = await supabase
        .from('conference_participants')
        .select('*')
        .eq('conference_id', conference.id)
        .order('created_at', { ascending: true });

      if (partError) throw partError;

      const participantList = (participants || []) as ConferenceParticipant[];
      const activeParticipants = participantList.filter(
        (p) => p.status === 'in_conference'
      ).length;
      const userInConference = participantList.some(
        (p) => p.participant_type === 'user' && p.status === 'in_conference'
      );
      const contactsInConference = participantList.filter(
        (p) => p.participant_type === 'contact' && p.status === 'in_conference'
      ).length;

      const status: ConferenceStatus = {
        conference: conference as EmergencyConference,
        participants: participantList,
        activeParticipants,
        userInConference,
        contactsInConference,
      };

      setConferenceStatus(status);
      return status;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch conference status';
      setError(errorMsg);
      console.error('Conference status error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!incidentId) return;

    let intervalId: NodeJS.Timeout | null = null;
    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      await fetchConferenceStatus(incidentId);

      // Set up polling as fallback
      if (autoRefresh) {
        intervalId = setInterval(() => {
          fetchConferenceStatus(incidentId);
        }, refreshInterval);
      }

      // Subscribe to conference changes
      const { data: conference } = await supabase
        .from('emergency_conferences')
        .select('id')
        .eq('incident_id', incidentId)
        .single();

      if (conference) {
        channel = supabase
          .channel(`conference:${conference.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'emergency_conferences',
              filter: `id=eq.${conference.id}`,
            },
            () => {
              fetchConferenceStatus(incidentId);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conference_participants',
              filter: `conference_id=eq.${conference.id}`,
            },
            (payload) => {
              console.log('Participant update:', payload);
              fetchConferenceStatus(incidentId);

              // Show toast for participant join
              if (payload.eventType === 'UPDATE' && payload.new.status === 'in_conference') {
                const participant = payload.new as ConferenceParticipant;
                if (participant.participant_type === 'contact') {
                  toast({
                    title: '👤 Responder Joined',
                    description: `${participant.participant_name || 'Contact'} has joined the emergency call`,
                  });
                }
              }
            }
          )
          .subscribe();
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [incidentId, autoRefresh, refreshInterval]);

  return {
    conferenceStatus,
    isLoading,
    error,
    refresh: () => incidentId ? fetchConferenceStatus(incidentId) : Promise.resolve(null),
  };
};
