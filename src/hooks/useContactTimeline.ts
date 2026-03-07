// useContactTimeline - React hook for accessing unified contact timeline
// Provides real-time updates and filtering of all customer interactions

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TimelineEvent {
  id: string;
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  eventType: string;
  eventCategory: 'communication' | 'emergency' | 'sales' | 'support' | 'system';
  eventTitle: string;
  eventDescription?: string;
  eventData: Record<string, any>;
  sourceType: string;
  sourceId?: string;
  relatedIncidentId?: string;
  relatedConferenceId?: string;
  relatedConversationId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  aiSummary?: string;
  aiTags?: string[];
  importanceScore: number;
  occurredAt: string;
  createdAt: string;
}

export interface ContactEngagementSummary {
  id: string;
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalInteractions: number;
  lastInteractionAt: string;
  firstInteractionAt: string;
  emailCount: number;
  chatCount: number;
  voiceCount: number;
  emergencyCount: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailOpenRate?: number;
  emailClickRate?: number;
  leadScore: number;
  leadStatus?: string;
  sentimentTrend?: string;
  riskLevel?: string;
  lastEmergencyAt?: string;
}

export interface AIContactContext {
  contextSummary: string;
  recentEvents: any[];
  engagementMetrics: Record<string, any>;
  riskIndicators: Record<string, any>;
}

interface UseContactTimelineOptions {
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  eventCategory?: string;
  eventType?: string;
  limit?: number;
  realtime?: boolean;
}

export const useContactTimeline = (options: UseContactTimelineOptions = {}) => {
  const {
    userId,
    contactEmail,
    contactPhone,
    eventCategory,
    eventType,
    limit = 50,
    realtime = true,
  } = options;

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [engagement, setEngagement] = useState<ContactEngagementSummary | null>(null);
  const [aiContext, setAIContext] = useState<AIContactContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline events
  const fetchTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('contact_timeline')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (contactEmail) {
        query = query.eq('contact_email', contactEmail);
      } else if (contactPhone) {
        query = query.eq('contact_phone', contactPhone);
      }

      if (eventCategory) {
        query = query.eq('event_category', eventCategory);
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTimeline((data || []) as TimelineEvent[]);
    } catch (err: any) {
      console.error('Failed to fetch timeline:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, contactEmail, contactPhone, eventCategory, eventType, limit]);

  // Fetch engagement summary
  const fetchEngagement = useCallback(async () => {
    if (!userId && !contactEmail && !contactPhone) return;

    try {
      let query = supabase
        .from('contact_engagement_summary')
        .select('*')
        .limit(1);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (contactEmail) {
        query = query.eq('contact_email', contactEmail);
      } else if (contactPhone) {
        query = query.eq('contact_phone', contactPhone);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw fetchError;
      }

      setEngagement(data as ContactEngagementSummary);
    } catch (err: any) {
      console.error('Failed to fetch engagement:', err);
    }
  }, [userId, contactEmail, contactPhone]);

  // Fetch AI context
  const fetchAIContext = useCallback(async () => {
    if (!userId && !contactEmail) return;

    try {
      const { data, error: fetchError } = await supabase.rpc('get_contact_ai_context', {
        p_user_id: userId || null,
        p_contact_email: contactEmail || null,
      });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setAIContext(data[0] as AIContactContext);
      }
    } catch (err: any) {
      console.error('Failed to fetch AI context:', err);
    }
  }, [userId, contactEmail]);

  // Add new timeline event
  const addEvent = useCallback(async (event: Partial<TimelineEvent>) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/timeline-aggregator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'add_event',
            event: {
              userId: userId || event.userId,
              contactEmail: contactEmail || event.contactEmail,
              contactPhone: contactPhone || event.contactPhone,
              ...event,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add timeline event');
      }

      // Refresh timeline
      await fetchTimeline();
      await fetchEngagement();
    } catch (err: any) {
      console.error('Failed to add event:', err);
      throw err;
    }
  }, [userId, contactEmail, contactPhone, fetchTimeline, fetchEngagement]);

  // Initial fetch
  useEffect(() => {
    fetchTimeline();
    fetchEngagement();
    fetchAIContext();
  }, [fetchTimeline, fetchEngagement, fetchAIContext]);

  // Setup real-time subscription
  useEffect(() => {
    if (!realtime) return;
    if (!userId && !contactEmail && !contactPhone) return;

    const channel = supabase
      .channel('timeline-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_timeline',
          filter: userId
            ? `user_id=eq.${userId}`
            : contactEmail
            ? `contact_email=eq.${contactEmail}`
            : `contact_phone=eq.${contactPhone}`,
        },
        (payload) => {
          console.log('Timeline change detected:', payload);
          fetchTimeline();
          fetchEngagement();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, contactEmail, contactPhone, realtime, fetchTimeline, fetchEngagement]);

  // Helper functions
  const getEventsByCategory = useCallback(
    (category: string) => {
      return timeline.filter((event) => event.eventCategory === category);
    },
    [timeline]
  );

  const getEventsByType = useCallback(
    (type: string) => {
      return timeline.filter((event) => event.eventType === type);
    },
    [timeline]
  );

  const getRecentEvents = useCallback(
    (days: number = 30) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return timeline.filter((event) => new Date(event.occurredAt) > cutoff);
    },
    [timeline]
  );

  const getCriticalEvents = useCallback(() => {
    return timeline.filter((event) => event.importanceScore <= 2);
  }, [timeline]);

  return {
    // Data
    timeline,
    engagement,
    aiContext,
    isLoading,
    error,

    // Actions
    refresh: fetchTimeline,
    addEvent,

    // Helpers
    getEventsByCategory,
    getEventsByType,
    getRecentEvents,
    getCriticalEvents,

    // Metrics (derived from engagement)
    totalInteractions: engagement?.totalInteractions || 0,
    leadScore: engagement?.leadScore || 0,
    riskLevel: engagement?.riskLevel || 'none',
    emailOpenRate: engagement?.emailOpenRate || 0,
    emergencyCount: engagement?.emergencyCount || 0,
  };
};

// Hook to add specific event types easily
export const useTimelineActions = (
  userId?: string,
  contactEmail?: string,
  contactPhone?: string
) => {
  const addSOSIncident = async (incidentId: string, location: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/timeline-aggregator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'add_event',
          event: {
            userId,
            contactEmail,
            contactPhone,
            eventType: 'sos_incident',
            eventCategory: 'emergency',
            eventTitle: 'Emergency SOS Activated',
            eventDescription: `Emergency at ${location}`,
            relatedIncidentId: incidentId,
            sentiment: 'urgent',
            importanceScore: 1,
          },
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to add SOS incident');
  };

  const addConferenceJoin = async (
    conferenceName: string,
    participantName: string,
    conferenceId: string
  ) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/timeline-aggregator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'add_event',
          event: {
            userId,
            contactEmail,
            contactPhone,
            eventType: 'conference_join',
            eventCategory: 'emergency',
            eventTitle: `${participantName} joined emergency conference`,
            relatedConferenceId: conferenceId,
            importanceScore: 1,
          },
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to add conference join');
  };

  const addChatMessage = async (message: string, isInbound: boolean) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/timeline-aggregator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'add_event',
          event: {
            userId,
            contactEmail,
            contactPhone,
            eventType: 'chat_message',
            eventCategory: 'communication',
            eventTitle: isInbound ? 'Customer message' : 'Our response',
            eventDescription: message,
            importanceScore: 3,
          },
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to add chat message');
  };

  return {
    addSOSIncident,
    addConferenceJoin,
    addChatMessage,
  };
};
