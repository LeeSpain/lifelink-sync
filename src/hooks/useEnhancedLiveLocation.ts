import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedRealtime } from './useUnifiedRealtime';
import { useOptimizedAuth } from './useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  user_id: string;
  family_group_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  status: 'online' | 'idle' | 'offline';
  created_at: string;
  updated_at: string;
}

interface LocationState {
  isTracking: boolean;
  accuracy: 'high' | 'balanced' | 'low';
  updateInterval: number;
  backgroundMode: boolean;
}

interface LocationMetrics {
  totalUpdates: number;
  successRate: number;
  averageAccuracy: number;
  batteryImpact: number;
  lastSync: Date | null;
}

export const useEnhancedLiveLocation = (familyGroupId?: string) => {
  const { user } = useOptimizedAuth();
  const realtime = useUnifiedRealtime();
  
  // Core state
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationState, setLocationState] = useState<LocationState>({
    isTracking: false,
    accuracy: 'balanced',
    updateInterval: 30000, // 30 seconds
    backgroundMode: false
  });
  const [metrics, setMetrics] = useState<LocationMetrics>({
    totalUpdates: 0,
    successRate: 100,
    averageAccuracy: 0,
    batteryImpact: 0,
    lastSync: null
  });
  const [error, setError] = useState<string | null>(null);

  // Refs for tracking
  const watchIdRef = useRef<number | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);

  // Get battery level with fallback
  const getBatteryLevel = useCallback(async (): Promise<number> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (e) {
      // Fallback for browsers without battery API
    }
    return 100; // Default fallback
  }, []);

  // Update location in database with enhanced error handling
  const updateLocation = useCallback(async (locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }) => {
    if (!user || !familyGroupId) return;

    try {
      const batteryLevel = await getBatteryLevel();
      
      const updateData = {
        user_id: user.id,
        family_group_id: familyGroupId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        battery_level: batteryLevel,
        status: 'online' as const
      };

      const { error: updateError } = await supabase
        .from('live_locations')
        .upsert(updateData, {
          onConflict: 'user_id,family_group_id'
        });

      if (updateError) throw updateError;

      // Update current location state
      setCurrentLocation({
        ...updateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalUpdates: prev.totalUpdates + 1,
        successRate: ((prev.successRate * (prev.totalUpdates - 1)) + 100) / prev.totalUpdates,
        averageAccuracy: locationData.accuracy ? 
          ((prev.averageAccuracy * (prev.totalUpdates - 1)) + locationData.accuracy) / prev.totalUpdates :
          prev.averageAccuracy,
        lastSync: new Date()
      }));

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      
      // Update error metrics
      setMetrics(prev => ({
        ...prev,
        totalUpdates: prev.totalUpdates + 1,
        successRate: ((prev.successRate * (prev.totalUpdates - 1)) + 0) / prev.totalUpdates
      }));

      console.error('Location update error:', err);
    }
  }, [user, familyGroupId, getBatteryLevel]);

  // Get current position with enhanced options
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: locationState.accuracy === 'high',
        timeout: locationState.accuracy === 'high' ? 15000 : 10000,
        maximumAge: locationState.accuracy === 'high' ? 60000 : 300000
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }, [locationState.accuracy]);

  // Start tracking with enhanced configuration
  const startTracking = useCallback(async () => {
    if (!user || !familyGroupId) {
      setError('User not authenticated or no family group');
      return;
    }

    try {
      // Request permission if needed
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        throw new Error('Geolocation permission denied');
      }

      setLocationState(prev => ({ ...prev, isTracking: true }));
      setError(null);

      // Get initial position
      try {
        const position = await getCurrentPosition();
        await updateLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined
        });
      } catch (positionError) {
        console.warn('Initial position failed:', positionError);
      }

      // Set up continuous tracking
      const watchOptions: PositionOptions = {
        enableHighAccuracy: locationState.accuracy === 'high',
        timeout: 10000,
        maximumAge: locationState.accuracy === 'high' ? 30000 : 60000
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          await updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          });
        },
        (error) => {
          console.error('Location watch error:', error);
          setError(`Location tracking error: ${error.message}`);
        },
        watchOptions
      );

      // Set up periodic updates
      updateTimerRef.current = setInterval(async () => {
        try {
          const position = await getCurrentPosition();
          await updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          });
        } catch (timerError) {
          console.warn('Periodic update failed:', timerError);
        }
      }, locationState.updateInterval);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(errorMessage);
      setLocationState(prev => ({ ...prev, isTracking: false }));
    }
  }, [user, familyGroupId, getCurrentPosition, updateLocation, locationState.accuracy, locationState.updateInterval]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    setLocationState(prev => ({ ...prev, isTracking: false }));

    // Clear watchers and timers
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    // Update status to offline
    if (user && familyGroupId) {
      try {
        await supabase
          .from('live_locations')
          .update({ status: 'offline' })
          .eq('user_id', user.id)
          .eq('family_group_id', familyGroupId);
      } catch (err) {
        console.error('Failed to update offline status:', err);
      }
    }
  }, [user, familyGroupId]);

  // Fetch locations of other family members
  const fetchLocations = useCallback(async () => {
    if (!familyGroupId) return;

    try {
      const { data, error } = await supabase
        .from('live_locations')
        .select(`
          *
        `)
        .eq('family_group_id', familyGroupId)
        .gte('updated_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedData = data?.map(location => ({
        ...location,
        status: (location.status as 'online' | 'idle' | 'offline') || 'offline'
      })) || [];

      setLocations(processedData);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to fetch family locations');
    }
  }, [familyGroupId]);

  // Set up real-time subscription for location updates
  useEffect(() => {
    if (!familyGroupId || !user) return;

    // Subscribe to location updates
    const subscriptionId = realtime.subscribe(
      `locations-${user.id}`,
      {
        channelName: `family-locations-${familyGroupId}`,
        events: [
          {
            event: '*',
            schema: 'public',
            table: 'live_locations',
            filter: `family_group_id=eq.${familyGroupId}`
          }
        ]
      },
      {
        onData: (payload) => {
          console.log('Location update received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setLocations(prev => {
              const existing = prev.findIndex(l => 
                l.user_id === payload.new.user_id && 
                l.family_group_id === payload.new.family_group_id
              );
              
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = payload.new;
                return updated;
              } else {
                return [...prev, payload.new];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setLocations(prev => prev.filter(l => 
              !(l.user_id === payload.old.user_id && 
                l.family_group_id === payload.old.family_group_id)
            ));
          }
        },
        onError: (error) => {
          console.error('Location subscription error:', error);
          setError('Real-time connection error');
        }
      }
    );

    subscriptionIdRef.current = subscriptionId;

    // Initial fetch
    fetchLocations();

    return () => {
      if (subscriptionId) {
        realtime.unsubscribe(`locations-${user.id}`, subscriptionId);
      }
    };
  }, [familyGroupId, user, realtime, fetchLocations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // Core data
    locations,
    currentLocation,
    locationState,
    metrics,
    error,
    
    // Actions
    startTracking,
    stopTracking,
    refetch: fetchLocations,
    
    // Configuration
    updateAccuracy: (accuracy: 'high' | 'balanced' | 'low') => 
      setLocationState(prev => ({ ...prev, accuracy })),
    updateInterval: (interval: number) => 
      setLocationState(prev => ({ ...prev, updateInterval: interval })),
    
    // Connection info
    connectionHealth: realtime.connectionHealth,
    isConnected: realtime.isConnected,
    
    // Computed values
    activeMembers: locations.filter(l => l.status === 'online'),
    lastUpdate: metrics.lastSync,
    trackingQuality: metrics.averageAccuracy < 10 ? 'excellent' : 
                    metrics.averageAccuracy < 50 ? 'good' : 'poor'
  };
};