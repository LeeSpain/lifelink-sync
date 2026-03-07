import { useState, useEffect, useCallback } from 'react';
import { useEnhancedCircleRealtime } from './useEnhancedCircleRealtime';
import { useEnhancedLiveLocation } from './useEnhancedLiveLocation';
import { useOptimizedAuth } from './useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
  };
  status: 'online' | 'away' | 'idle' | 'offline';
  lastSeen: Date;
  battery?: number;
  connectionHealth: {
    isConnected: boolean;
    lastHeartbeat: Date | null;
    reconnectAttempts: number;
    latency: number | null;
  };
  device?: {
    type: 'mobile' | 'desktop' | 'tablet';
    name?: string;
  };
  presence?: {
    isTyping: boolean;
    isLookingAtMap: boolean;
    activity: string;
  };
  permissions: {
    canViewLocation: boolean;
    canViewHistory: boolean;
    canViewDevices: boolean;
  };
}

interface PresenceActivity {
  userId: string;
  activity: 'typing' | 'viewing_map' | 'idle';
  timestamp: Date;
}

interface ConnectionMetrics {
  totalMembers: number;
  onlineMembers: number;
  activeConnections: number;
  averageLatency: number;
  lastUpdate: Date | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export const useEnhancedConnectionDisplay = (familyGroupId?: string) => {
  const { user } = useOptimizedAuth();
  const circleRealtime = useEnhancedCircleRealtime(familyGroupId);
  const liveLocation = useEnhancedLiveLocation(familyGroupId);
  
  // Enhanced state management
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [presenceActivities, setPresenceActivities] = useState<PresenceActivity[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    totalMembers: 0,
    onlineMembers: 0,
    activeConnections: 0,
    averageLatency: 0,
    lastUpdate: null,
    connectionQuality: 'good'
  });
  const [permissions, setPermissions] = useState<Map<string, any>>(new Map());

  // Load family members with enhanced data
  const loadFamilyMembers = useCallback(async () => {
    if (!familyGroupId || !user) return;

    try {
      // Get family memberships with user profiles
      const { data: memberships, error: membershipsError } = await supabase
        .from('family_memberships')
        .select(`
          user_id,
          status,
          created_at
        `)
        .eq('group_id', familyGroupId)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      // Get user profiles separately
      const userIds = memberships?.map(m => m.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone')
        .in('user_id', userIds);

      if (profilesError) console.warn('Failed to load profiles:', profilesError);

      // Get permissions for each member
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('circle_permissions')
        .select('*')
        .eq('owner_id', user.id);

      if (permissionsError) console.warn('Failed to load permissions:', permissionsError);

      // Create permissions map
      const permissionsMap = new Map();
      permissionsData?.forEach(perm => {
        permissionsMap.set(perm.family_user_id, perm);
      });
      setPermissions(permissionsMap);

      // Create profiles map
      const profilesMap = new Map();
      profiles?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Process family members
      const processedMembers: FamilyMember[] = memberships?.map(membership => {
        const profile = profilesMap.get(membership.user_id) || {
          first_name: 'Unknown',
          last_name: 'User',
          phone: null
        };
        const userPermissions = permissionsMap.get(membership.user_id) || {
          can_view_location: true,
          can_view_history: true,
          can_view_devices: true
        };

        // Find presence data
        const presence = circleRealtime.presences.find(p => p.user_id === membership.user_id);
        
        // Find location data
        const location = liveLocation.locations.find(l => l.user_id === membership.user_id);

        // Determine status based on presence and location data
        let status: FamilyMember['status'] = 'offline';
        if (presence && presence.last_seen) {
          const lastSeenTime = new Date(presence.last_seen);
          const timeDiff = Date.now() - lastSeenTime.getTime();
          
          if (timeDiff < 2 * 60 * 1000) { // 2 minutes
            status = presence.is_paused ? 'idle' : 'online';
          } else if (timeDiff < 30 * 60 * 1000) { // 30 minutes
            status = 'away';
          } else {
            status = 'offline';
          }
        }

        return {
          id: membership.user_id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          avatar: undefined, // Avatar not available in current schema
          email: profile.user_id, // Will need to get from auth.users if needed
          location: location ? {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy
          } : undefined,
          status,
          lastSeen: presence?.last_seen ? new Date(presence.last_seen) : new Date(membership.created_at),
          battery: presence?.battery || location?.battery_level,
          connectionHealth: {
            isConnected: status === 'online',
            lastHeartbeat: presence?.last_seen ? new Date(presence.last_seen) : null,
            reconnectAttempts: 0, // Will be enhanced with real reconnection tracking
            latency: Math.random() * 200 + 50 // Mock latency for now
          },
          device: location ? {
            type: 'mobile', // Default to mobile for location-enabled devices
            name: 'Mobile Device'
          } : undefined,
          presence: {
            isTyping: false, // Will be enhanced with real-time typing detection
            isLookingAtMap: false, // Will be enhanced with map view tracking
            activity: status === 'online' ? 'Active' : 'Away'
          },
          permissions: {
            canViewLocation: userPermissions.can_view_location,
            canViewHistory: userPermissions.can_view_history,
            canViewDevices: userPermissions.can_view_devices
          }
        };
      }) || [];

      setFamilyMembers(processedMembers);

      // Update connection metrics
      const onlineCount = processedMembers.filter(m => m.status === 'online').length;
      const avgLatency = processedMembers
        .filter(m => m.connectionHealth.latency)
        .reduce((acc, m) => acc + (m.connectionHealth.latency || 0), 0) / onlineCount || 0;

      setConnectionMetrics({
        totalMembers: processedMembers.length,
        onlineMembers: onlineCount,
        activeConnections: onlineCount,
        averageLatency: avgLatency,
        lastUpdate: new Date(),
        connectionQuality: avgLatency < 100 ? 'excellent' : 
                          avgLatency < 300 ? 'good' : 
                          avgLatency < 1000 ? 'fair' : 'poor'
      });

    } catch (error) {
      console.error('Error loading family members:', error);
    }
  }, [familyGroupId, user, circleRealtime.presences, liveLocation.locations]);

  // Track presence activities
  const trackPresenceActivity = useCallback((userId: string, activity: 'typing' | 'viewing_map' | 'idle') => {
    setPresenceActivities(prev => {
      const filtered = prev.filter(a => !(a.userId === userId && a.activity === activity));
      return [...filtered, {
        userId,
        activity,
        timestamp: new Date()
      }];
    });

    // Update family member presence
    setFamilyMembers(prev => prev.map(member => {
      if (member.id === userId) {
        return {
          ...member,
          presence: {
            ...member.presence!,
            isTyping: activity === 'typing',
            isLookingAtMap: activity === 'viewing_map',
            activity: activity === 'typing' ? 'Typing...' : 
                     activity === 'viewing_map' ? 'Viewing map' : 'Active'
          }
        };
      }
      return member;
    }));

    // Clear activity after timeout
    setTimeout(() => {
      setPresenceActivities(prev => 
        prev.filter(a => !(a.userId === userId && a.activity === activity))
      );
      
      setFamilyMembers(prev => prev.map(member => {
        if (member.id === userId) {
          return {
            ...member,
            presence: {
              ...member.presence!,
              isTyping: false,
              isLookingAtMap: false,
              activity: member.status === 'online' ? 'Active' : 'Away'
            }
          };
        }
        return member;
      }));
    }, activity === 'typing' ? 3000 : 10000); // 3s for typing, 10s for map viewing

  }, []);

  // Enhanced communication actions
  const callMember = useCallback(async (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    // Track activity
    trackPresenceActivity(user?.id || '', 'typing');

    // Implement actual calling logic here
    console.log('Calling member:', member.name);
    
    // For now, just show a placeholder
    alert(`Calling ${member.name}...`);
  }, [familyMembers, trackPresenceActivity, user]);

  const messageMember = useCallback(async (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    // Track activity
    trackPresenceActivity(user?.id || '', 'typing');

    // Implement actual messaging logic here
    console.log('Messaging member:', member.name);
    
    // For now, just show a placeholder
    alert(`Opening chat with ${member.name}...`);
  }, [familyMembers, trackPresenceActivity, user]);

  const videoCallMember = useCallback(async (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    // Track activity
    trackPresenceActivity(user?.id || '', 'viewing_map');

    // Implement actual video calling logic here
    console.log('Video calling member:', member.name);
    
    // For now, just show a placeholder
    alert(`Starting video call with ${member.name}...`);
  }, [familyMembers, trackPresenceActivity, user]);

  const updateMemberPermissions = useCallback(async (memberId: string, permissions: Partial<{
    can_view_location: boolean;
    can_view_history: boolean;
    can_view_devices: boolean;
  }>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('circle_permissions')
        .upsert({
          owner_id: user.id,
          family_user_id: memberId,
          ...permissions
        });

      if (error) throw error;

      // Update local state
      setFamilyMembers(prev => prev.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            permissions: {
              ...member.permissions,
              canViewLocation: permissions.can_view_location ?? member.permissions.canViewLocation,
              canViewHistory: permissions.can_view_history ?? member.permissions.canViewHistory,
              canViewDevices: permissions.can_view_devices ?? member.permissions.canViewDevices
            }
          };
        }
        return member;
      }));

    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  }, [user]);

  // Load data when dependencies change
  useEffect(() => {
    loadFamilyMembers();
  }, [loadFamilyMembers]);

  // Simulate map viewing activity when user is on map page
  useEffect(() => {
    if (user && window.location.pathname.includes('live-map')) {
      trackPresenceActivity(user.id, 'viewing_map');
    }
  }, [user, trackPresenceActivity]);

  return {
    // Core data
    familyMembers,
    connectionMetrics,
    presenceActivities,
    
    // Actions
    loadFamilyMembers,
    trackPresenceActivity,
    callMember,
    messageMember,
    videoCallMember,
    updateMemberPermissions,
    
    // Computed values
    onlineMembers: familyMembers.filter(m => m.status === 'online'),
    offlineMembers: familyMembers.filter(m => m.status !== 'online'),
    currentUser: familyMembers.find(m => m.id === user?.id),
    
    // Integration with existing hooks
    circleRealtime,
    liveLocation,
    
    // Connection status
    isConnected: circleRealtime.isConnected && liveLocation.isConnected,
    hasErrors: circleRealtime.hasErrors || Boolean(liveLocation.error)
  };
};