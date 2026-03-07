import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useCircleRealtime
 * Real-time subscription to `live_presence` and `place_events` with RLS enabled.
 */
type Presence = { 
  user_id: string; 
  lat: number; 
  lng: number; 
  last_seen?: string; 
  battery?: number | null; 
  is_paused?: boolean;
};

type Circle = { 
  id: string; 
  name: string; 
  member_count?: number;
};

type PlaceEvent = {
  id: string;
  user_id: string;
  place_id: string;
  event: 'enter' | 'exit';
  occurred_at: string;
  place?: {
    name: string;
  };
};

export function useCircleRealtime(activeCircleId: string | null) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [recentEvents, setRecentEvents] = useState<PlaceEvent[]>([]);
  const { user } = useAuth();

  const loadInitial = useCallback(async () => {
    if (!user) return;

    try {
      // Load user's family groups (circles)
      const { data: memberships, error: membershipError } = await supabase
        .from("family_memberships")
        .select(`
          group_id,
          family_groups!inner(id, owner_user_id),
          status
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (membershipError) {
        console.error("Error loading memberships:", membershipError);
        return;
      }

      // Transform to circles format
      const circleData = memberships?.map(m => ({
        id: m.group_id,
        name: `Family Circle ${m.group_id.slice(0, 8)}`, // TODO: Add proper name to family_groups table
        member_count: 0 // Will be loaded separately if needed
      })) || [];

      setCircles(circleData);

      // If we have an active circle, load presence data
      if (activeCircleId) {
        await loadPresenceForCircle(activeCircleId);
        await loadRecentEvents(activeCircleId);
      }
    } catch (error) {
      console.error("Error in loadInitial:", error);
    }
  }, [user, activeCircleId]);

  const loadPresenceForCircle = async (circleId: string) => {
    try {
      // Load live presence for circle members
      const { data: members, error } = await supabase
        .from("family_memberships")
        .select("user_id")
        .eq("group_id", circleId)
        .eq("status", "active");

      if (error || !members) return;

      const { data: presenceData, error: presenceError } = await supabase
        .from("live_presence")
        .select("*")
        .in("user_id", members.map(m => m.user_id));

      if (presenceError) {
        console.error("Error loading presence:", presenceError);
        return;
      }

      const mappedPresence = presenceData?.map(p => ({
        user_id: p.user_id,
        lat: p.lat || 0,
        lng: p.lng || 0,
        last_seen: p.last_seen,
        battery: p.battery,
        is_paused: p.is_paused || false,
      })).filter(p => p.lat && p.lng) || [];

      setPresences(mappedPresence);
    } catch (error) {
      console.error("Error loading circle presence:", error);
    }
  };

  const loadRecentEvents = async (circleId: string) => {
    try {
      const { data: events, error } = await supabase
        .from("place_events")
        .select(`
          *,
          places!inner(name, family_group_id)
        `)
        .eq("places.family_group_id", circleId)
        .order("occurred_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading place events:", error);
        return;
      }

      const eventData = events?.map(e => ({
        id: e.id,
        user_id: e.user_id,
        place_id: e.place_id,
        event: e.event as 'enter' | 'exit',
        occurred_at: e.occurred_at,
        place: { name: e.places?.name || "Unknown Place" }
      })) || [];

      setRecentEvents(eventData);
    } catch (error) {
      console.error("Error loading recent events:", error);
    }
  };

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!activeCircleId || !user) return;

    console.log(`🔄 Setting up realtime for circle ${activeCircleId}`);

    // Subscribe to live presence updates
    const presenceChannel = supabase
      .channel(`presence-${activeCircleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_presence'
        },
        (payload) => {
          console.log('Live presence update:', payload);
          loadPresenceForCircle(activeCircleId);
        }
      )
      .subscribe();

    // Subscribe to place events
    const eventsChannel = supabase
      .channel(`events-${activeCircleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'place_events'
        },
        (payload) => {
          console.log('New place event:', payload);
          loadRecentEvents(activeCircleId);
        }
      )
      .subscribe();

    return () => {
      console.log(`🔄 Cleaning up realtime for circle ${activeCircleId}`);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [activeCircleId, user]);

  return { 
    presences, 
    circles, 
    recentEvents,
    loadInitial,
    refresh: () => {
      if (activeCircleId) {
        loadPresenceForCircle(activeCircleId);
        loadRecentEvents(activeCircleId);
      }
    }
  };
}