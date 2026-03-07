import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUnifiedRealtime } from './useUnifiedRealtime';
import { useOptimizedAuth } from './useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';

// Enhanced types with better performance tracking
interface Presence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
  accuracy?: number;
  speed?: number;
  status?: 'online' | 'away' | 'offline';
}

interface Circle {
  id: string;
  name: string;
  owner_user_id: string;
  member_count?: number;
  last_activity?: string;
}

interface PlaceEvent {
  id: string;
  user_id: string;
  place_name: string;
  event_type: 'enter' | 'exit';
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface RealtimeMetrics {
  totalSubscriptions: number;
  activePresences: number;
  lastUpdate: Date | null;
  averageLatency: number;
  errorCount: number;
}

export const useEnhancedCircleRealtime = (activeCircleId: string | null) => {
  const { user } = useOptimizedAuth();
  const realtime = useUnifiedRealtime();
  const { subscribe, unsubscribe } = realtime;
  
  // Enhanced state management
  const [presences, setPresences] = useState<Presence[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [recentEvents, setRecentEvents] = useState<PlaceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    totalSubscriptions: 0,
    activePresences: 0,
    lastUpdate: null,
    averageLatency: 0,
    errorCount: 0
  });

  // Subscription IDs for cleanup
  const [subscriptionIds, setSubscriptionIds] = useState<{
    presence?: string;
    events?: string;
    circles?: string;
  }>({});

  // Load initial data with caching
  const loadInitial = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Load circles - using family_groups table  
      const { data: circlesData, error: circlesError } = await supabase
        .from('family_groups')
        .select(`
          id,
          owner_user_id,
          owner_seat_quota,
          created_at
        `)
        .eq('owner_user_id', user.id);

      if (circlesError) throw circlesError;
      
      const processedCircles = circlesData?.map(circle => ({
        id: circle.id,
        name: `Family Group`, // Default name since no name column
        owner_user_id: circle.owner_user_id,
        member_count: circle.owner_seat_quota || 1
      })) || [];
      
      setCircles(processedCircles);

      // Load presence data for active circle
      if (activeCircleId) {
        await Promise.all([
          loadPresenceForCircle(activeCircleId),
          loadRecentEvents(activeCircleId)
        ]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeCircleId]);

  // Load presence data for specific circle
  const loadPresenceForCircle = useCallback(async (circleId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_presence')
        .select(`
          user_id,
          lat,
          lng,
          last_seen,
          battery,
          is_paused
        `)
        .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const processedPresences = data?.map(presence => ({
        user_id: presence.user_id,
        lat: presence.lat,
        lng: presence.lng,
        last_seen: presence.last_seen,
        battery: presence.battery,
        is_paused: presence.is_paused,
        accuracy: 10, // Default accuracy
        speed: 0, // Default speed
        status: 'online' as const
      })) || [];

      setPresences(processedPresences);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activePresences: processedPresences.filter(p => p.status === 'online').length,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  }, []);

  // Load recent place events
  const loadRecentEvents = useCallback(async (circleId: string) => {
    try {
      const { data, error } = await supabase
        .from('place_events')
        .select(`
          id,
          user_id,
          event,
          occurred_at
        `)
        .order('occurred_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const processedEvents = data?.map(event => ({
        id: event.id,
        user_id: event.user_id,
        place_name: 'Unknown Location', // Default since no place_name column
        event_type: event.event as 'enter' | 'exit',
        timestamp: event.occurred_at
      })) || [];

      setRecentEvents(processedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, []);

  // Set up real-time subscriptions when circle changes
  useEffect(() => {
    if (!activeCircleId || !user) return;

    // Clean up existing subscriptions
    Object.values(subscriptionIds).forEach(id => {
      if (id) unsubscribe(user.id, id);
    });

    // Subscribe to live presence updates
    const presenceChannelId = subscribe(
      `presence-${user.id}`,
      {
        channelName: `circle-presence-${activeCircleId}`,
        events: [
          {
            event: '*',
            schema: 'public',
            table: 'live_presence',
            filter: `circle_id=eq.${activeCircleId}`
          }
        ],
        presence: true
      },
      {
        onData: (payload) => {
          console.log('Presence update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setPresences(prev => {
              const existing = prev.findIndex(p => p.user_id === payload.new.user_id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = {
                  ...updated[existing],
                  ...payload.new
                };
                return updated;
              } else {
                return [...prev, payload.new];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setPresences(prev => prev.filter(p => p.user_id !== payload.old.user_id));
          }
          
          // Update metrics
          setMetrics(prev => ({
            ...prev,
            lastUpdate: new Date(),
            totalSubscriptions: prev.totalSubscriptions + 1
          }));
        },
        onPresence: (presenceState) => {
          console.log('Presence state update:', presenceState);
        },
        onError: (error) => {
          console.error('Presence subscription error:', error);
          setMetrics(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1
          }));
        }
      }
    );

    // Subscribe to place events
    const eventsChannelId = subscribe(
      `events-${user.id}`,
      {
        channelName: `circle-events-${activeCircleId}`,
        events: [
          {
            event: 'INSERT',
            schema: 'public',
            table: 'place_events',
            filter: `circle_id=eq.${activeCircleId}`
          }
        ]
      },
      {
        onData: (payload) => {
          console.log('Place event:', payload);
          
          if (payload.eventType === 'INSERT') {
            setRecentEvents(prev => [payload.new, ...prev.slice(0, 19)]);
          }
        },
        onError: (error) => {
          console.error('Events subscription error:', error);
        }
      }
    );

    setSubscriptionIds({
      presence: presenceChannelId,
      events: eventsChannelId
    });

    return () => {
      // Cleanup subscriptions
      if (presenceChannelId) unsubscribe(`presence-${user.id}`, presenceChannelId);
      if (eventsChannelId) unsubscribe(`events-${user.id}`, eventsChannelId);
    };
  }, [activeCircleId, user?.id, subscribe, unsubscribe]);

  // Enhanced refresh with performance tracking
  const refresh = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      await loadInitial();
      
      const latency = Date.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        averageLatency: (prev.averageLatency + latency) / 2
      }));
    } catch (error) {
      console.error('Refresh error:', error);
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
    }
  }, [loadInitial]);

  // Initialize on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Memoized computed values for performance
  const computedData = useMemo(() => {
    const onlineMembers = presences.filter(p => p.status === 'online');
    const activeMembers = presences.filter(p => !p.is_paused && p.status !== 'offline');
    const recentActivity = recentEvents.slice(0, 5);
    
    return {
      onlineMembers,
      activeMembers,
      recentActivity,
      totalMembers: presences.length,
      connectionQuality: realtime.connectionLatency ? 
        (realtime.connectionLatency < 100 ? 'excellent' : 
         realtime.connectionLatency < 300 ? 'good' : 'poor') : 'unknown'
    };
  }, [presences, recentEvents, realtime.connectionLatency]);

  return {
    // Core data
    presences,
    circles,
    recentEvents,
    
    // Loading states
    isLoading,
    
    // Actions
    loadInitial,
    refresh,
    
    // Enhanced metrics and computed data
    metrics,
    ...computedData,
    
    // Connection info
    connectionHealth: realtime.connectionHealth,
    isConnected: realtime.isConnected,
    hasErrors: realtime.hasErrors
  };
};