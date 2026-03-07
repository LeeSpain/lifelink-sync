import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface FamilyPresence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen: string;
  battery?: number;
  is_paused?: boolean;
  status?: 'online' | 'idle' | 'offline';
  speed?: number;
  accuracy?: number;
  activity?: 'driving' | 'walking' | 'stationary';
}

interface EmergencyAlert {
  id: string;
  user_id: string;
  type: 'sos' | 'panic' | 'medical' | 'accident';
  location: { lat: number; lng: number };
  message?: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface FamilyNotification {
  id: string;
  user_id: string;
  type: 'location_update' | 'emergency' | 'check_in' | 'battery_low' | 'geofence';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function useRealTimeFamily(familyGroupId?: string) {
  const { user } = useOptimizedAuth();
  const { toast } = useToast();
  
  const [presences, setPresences] = useState<FamilyPresence[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Real-time presence tracking
  const handlePresenceUpdate = useCallback((payload: any) => {
    const presence = payload.new as FamilyPresence;
    
    setPresences(prev => {
      const existing = prev.findIndex(p => p.user_id === presence.user_id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...presence, status: getPresenceStatus(presence) };
        return updated;
      }
      return [...prev, { ...presence, status: getPresenceStatus(presence) }];
    });
    
    setLastUpdate(new Date());
    
    // Show toast for significant location changes
    if (presence.user_id !== user?.id && presence.speed && presence.speed > 50) {
      toast({
        title: "Family Member Moving",
        description: `${presence.user_id} is traveling at ${presence.speed} km/h`,
        duration: 3000
      });
    }
  }, [user?.id, toast]);

  // Emergency alert handling
  const handleEmergencyAlert = useCallback((payload: any) => {
    const alert = payload.new as EmergencyAlert;
    
    setAlerts(prev => [alert, ...prev]);
    
    // Critical emergency notification
    if (alert.user_id !== user?.id) {
      toast({
        title: "🚨 FAMILY EMERGENCY",
        description: `${alert.type.toUpperCase()} alert from family member`,
        variant: "destructive",
        duration: 0 // Persistent notification
      });
      
      // Browser notification for emergency
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Family Emergency Alert', {
          body: `${alert.type.toUpperCase()} alert from family member`,
          icon: '/emergency-icon.png',
          tag: `emergency-${alert.id}`,
          requireInteraction: true
        });
      }
      
      // Vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  }, [user?.id, toast]);

  // Family notifications
  const handleFamilyNotification = useCallback((payload: any) => {
    const notification = payload.new as FamilyNotification;
    
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'urgent' ? "destructive" : "default",
        duration: notification.priority === 'urgent' ? 8000 : 5000
      });
    }
  }, [toast]);

  // Determine presence status from last seen
  const getPresenceStatus = (presence: FamilyPresence): 'online' | 'idle' | 'offline' => {
    if (presence.is_paused) return 'idle';
    
    const lastSeen = new Date(presence.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'idle';
    return 'offline';
  };

  // Send check-in
  const sendCheckIn = useCallback(async (message?: string) => {
    if (!user || !familyGroupId) return;
    
    try {
      const { error } = await supabase
        .from('family_notifications')
        .insert({
          client_id: user.id,
          message_type: 'check_in',
          message: message || "I'm safe and doing well",
          language: 'en'
        });
      
      if (error) throw error;
      
      toast({
        title: "✅ Check-in Sent",
        description: "Your family has been notified you're safe",
        duration: 3000
      });
    } catch (error) {
      console.error('Check-in failed:', error);
      toast({
        title: "Check-in Failed",
        description: "Unable to send check-in. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, familyGroupId, toast]);

  // Trigger emergency alert
  const triggerEmergency = useCallback(async (type: EmergencyAlert['type'], message?: string) => {
    if (!user) return;
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        });
      });
      
      const { error } = await supabase
        .from('sos_events')
        .insert({
          user_id: user.id,
          group_id: familyGroupId,
          type,
          location: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
          notes: message,
          status: 'active'
        });
      
      if (error) throw error;
      
      toast({
        title: "🚨 Emergency Alert Sent",
        description: "Your family has been notified immediately",
        variant: "destructive",
        duration: 0
      });
    } catch (error) {
      console.error('Emergency trigger failed:', error);
      toast({
        title: "Emergency Alert Failed",
        description: "Unable to send alert. Please call emergency services.",
        variant: "destructive"
      });
    }
  }, [user, familyGroupId, toast]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !familyGroupId) return;

    setIsConnected(false);
    
    // Request notification permission
    requestNotificationPermission();

    const presenceChannel = supabase
      .channel(`family-presence-${familyGroupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations',
          filter: `family_group_id=eq.${familyGroupId}`
        },
        handlePresenceUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_events',
          filter: `group_id=eq.${familyGroupId}`
        },
        handleEmergencyAlert
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_notifications',
          filter: `client_id=eq.${user.id}`
        },
        handleFamilyNotification
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('Real-time family tracking connected');
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
      setIsConnected(false);
    };
  }, [user, familyGroupId, handlePresenceUpdate, handleEmergencyAlert, handleFamilyNotification, requestNotificationPermission]);

  // Load initial data
  useEffect(() => {
    if (!user || !familyGroupId) return;

    const loadInitialData = async () => {
      try {
        // Load family presences from live_locations
        const { data: presenceData } = await supabase
          .from('live_locations')
          .select('user_id, latitude, longitude, last_seen, battery_level, status')
          .eq('family_group_id', familyGroupId)
          .order('last_seen', { ascending: false });

        if (presenceData) {
          // Convert to FamilyPresence format and get unique users only
          const uniqueUsers = new Map();
          presenceData.forEach(p => {
            if (!uniqueUsers.has(p.user_id) || new Date(p.last_seen) > new Date(uniqueUsers.get(p.user_id).last_seen)) {
              uniqueUsers.set(p.user_id, {
                user_id: p.user_id,
                lat: p.latitude,
                lng: p.longitude,
                last_seen: p.last_seen,
                battery: p.battery_level,
                is_paused: p.status === 'paused',
                status: getPresenceStatus({
                  user_id: p.user_id,
                  lat: p.latitude,
                  lng: p.longitude,
                  last_seen: p.last_seen,
                  battery: p.battery_level,
                  is_paused: p.status === 'paused'
                })
              });
            }
          });
          setPresences(Array.from(uniqueUsers.values()));
        }

        // Load recent alerts
        const { data: alertData } = await (supabase as any)
          .from('sos_events')
          .select('id, user_id, status, created_at')
          .eq('group_id', familyGroupId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10);

        if (alertData) {
          const mappedAlerts = alertData.map(alert => ({
            id: alert.id,
            user_id: alert.user_id,
            type: 'sos' as 'sos' | 'panic' | 'medical' | 'accident',
            location: { lat: 0, lng: 0 },
            message: undefined,
            timestamp: alert.created_at,
            status: alert.status as 'active' | 'acknowledged' | 'resolved'
          }));
          setAlerts(mappedAlerts);
        }

        // Load recent notifications
        const { data: notificationData } = await (supabase as any)
          .from('family_notifications')
          .select('id, sent_by, message_type, message, sent_at, delivered')
          .eq('client_id', user.id)
          .order('sent_at', { ascending: false })
          .limit(20);

        if (notificationData) {
          setNotifications(notificationData.map(n => ({
            id: n.id,
            user_id: n.sent_by || '',
            type: n.message_type as any,
            title: getNotificationTitle(n.message_type),
            message: n.message || '',
            timestamp: n.sent_at || '',
            read: n.delivered || false,
            priority: getPriorityFromType(n.message_type)
          })));
        }
      } catch (error) {
        console.error('Failed to load initial family data:', error);
      }
    };

    loadInitialData();
  }, [user, familyGroupId]);

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'quick_action': return 'Quick Message';
      case 'check_in': return 'Family Check-in';
      case 'emergency': return 'Emergency Alert';
      case 'battery_low': return 'Low Battery';
      default: return 'Family Update';
    }
  };

  const getPriorityFromType = (type: string): 'low' | 'medium' | 'high' | 'urgent' => {
    switch (type) {
      case 'emergency': return 'urgent';
      case 'check_in': return 'high';
      case 'battery_low': return 'medium';
      default: return 'low';
    }
  };

  return {
    // State
    presences,
    alerts,
    notifications,
    isConnected,
    lastUpdate,
    
    // Actions
    sendCheckIn,
    triggerEmergency,
    requestNotificationPermission,
    
    // Computed
    onlineMembers: presences.filter(p => p.status === 'online').length,
    totalMembers: presences.length,
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    unreadNotifications: notifications.filter(n => !n.read).length
  };
}