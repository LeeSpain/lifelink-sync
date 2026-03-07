import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LiveLocationData {
  id: string;
  user_id: string;
  family_group_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  battery_level?: number;
  status: 'online' | 'idle' | 'offline';
  last_seen: string;
  created_at: string;
  updated_at: string;
}

interface LocationState {
  isTracking: boolean;
  highAccuracyMode: boolean;
  updateInterval: number;
  backgroundSync: boolean;
}

interface LocationMetrics {
  totalUpdates: number;
  successRate: number;
  averageAccuracy: number;
  lastSuccessfulUpdate: string | null;
}

export const useLiveLocation = (familyGroupId?: string) => {
  const [locations, setLocations] = useState<LiveLocationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState>({
    isTracking: false,
    highAccuracyMode: true,
    updateInterval: 15000, // 15 seconds for high precision
    backgroundSync: true
  });
  const [metrics, setMetrics] = useState<LocationMetrics>({
    totalUpdates: 0,
    successRate: 100,
    averageAccuracy: 0,
    lastSuccessfulUpdate: null
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const watchId = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<GeolocationPosition | null>(null);
  const metricsRef = useRef({ attempts: 0, successes: 0, accuracySum: 0 });
  const trackingStartedRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get battery level
  const getBatteryLevel = useCallback(async (): Promise<number | undefined> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    return undefined;
  }, []);

  // Update location with enhanced tracking
  const updateLocation = useCallback(async (locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    battery_level?: number;
  }, isManual = false) => {
    if (!user) return false;

    metricsRef.current.attempts++;

    try {
      // Get battery level if not provided
      const batteryLevel = locationData.battery_level ?? await getBatteryLevel();

  // Use INSERT with ON CONFLICT DO UPDATE for proper upsert
      const { error } = await supabase
        .from('live_locations')
        .upsert({
          user_id: user.id,
          family_group_id: familyGroupId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          heading: locationData.heading,
          speed: locationData.speed,
          battery_level: batteryLevel,
          status: 'online', // Always online when actively updating location
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update metrics
      metricsRef.current.successes++;
      if (locationData.accuracy) {
        metricsRef.current.accuracySum += locationData.accuracy;
      }

      setMetrics(prev => ({
        totalUpdates: prev.totalUpdates + 1,
        successRate: Math.round((metricsRef.current.successes / metricsRef.current.attempts) * 100),
        averageAccuracy: Math.round(metricsRef.current.accuracySum / metricsRef.current.successes),
        lastSuccessfulUpdate: new Date().toISOString()
      }));

      setError(null);
      return true;
    } catch (error) {
      console.error('Failed to update location:', error);
      setError(error instanceof Error ? error.message : 'Failed to update location');
      return false;
    }
  }, [user, familyGroupId, getBatteryLevel]);

  // Get current position and update location
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  // Enhanced location tracking with watch position
  const startTracking = useCallback(async (options?: {
    highAccuracy?: boolean;
    updateInterval?: number;
    backgroundSync?: boolean;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start location tracking",
        variant: "destructive"
      });
      return false;
    }

    // Prevent multiple simultaneous starts with debouncing
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (trackingStartedRef.current || locationState.isTracking) {
      console.log('Location tracking already active or starting');
      return true;
    }

    trackingStartedRef.current = true;

    try {
      // Update location state
      const newState = {
        isTracking: true,
        highAccuracyMode: options?.highAccuracy ?? true,
        updateInterval: options?.updateInterval ?? 15000,
        backgroundSync: options?.backgroundSync ?? true
      };
      setLocationState(newState);

      // Get initial position with high accuracy
      const position = await getCurrentPosition();
      lastLocationRef.current = position;

      const success = await updateLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      }, true);

      if (!success) {
        throw new Error('Failed to initialize location tracking');
      }

      // Start continuous tracking with watchPosition
      if (navigator.geolocation && newState.highAccuracyMode) {
        watchId.current = navigator.geolocation.watchPosition(
          async (position) => {
            lastLocationRef.current = position;
            await updateLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            });
          },
          (error) => {
            console.error('Watch position error:', error);
            setError(`Location tracking error: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 30000
          }
        );
      }

      // Fallback periodic updates
      updateIntervalRef.current = setInterval(async () => {
        try {
          const position = await getCurrentPosition();
          lastLocationRef.current = position;
          await updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          });
        } catch (error) {
          console.error('Periodic location update failed:', error);
        }
      }, newState.updateInterval);

      setError(null);
      
      // Debounced success notification to prevent spam
      debounceTimeoutRef.current = setTimeout(() => {
        toast({
          title: "Live Tracking Started",
          description: `High-precision tracking active (${newState.updateInterval/1000}s updates)`,
        });
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to start tracking:', error);
      trackingStartedRef.current = false;
      setLocationState(prev => ({ ...prev, isTracking: false }));
      setError(error instanceof Error ? error.message : 'Failed to start tracking');
      toast({
        title: "Location Access Required",
        description: "Please enable location access for live tracking",
        variant: "destructive"
      });
      return false;
    }
  }, [user, getCurrentPosition, updateLocation, toast]);

  // Stop tracking with cleanup - only when explicitly requested
  const stopTracking = useCallback(async (explicit = false) => {
    if (!user) return;

    try {
      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Clear intervals and watchers
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      trackingStartedRef.current = false;

      // Only set offline status if explicitly stopped by user
      if (explicit) {
        const { error } = await supabase
          .from('live_locations')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Live Tracking Stopped",
          description: "Location sharing has been disabled"
        });
      }

      setLocationState(prev => ({ ...prev, isTracking: false }));

    } catch (error) {
      console.error('Failed to stop tracking:', error);
      setError('Failed to stop tracking');
    }
  }, [user, toast]);

  // Fetch family locations
  const fetchLocations = useCallback(async () => {
    if (!familyGroupId) return;
    
    try {
      const { data, error } = await supabase
        .from('live_locations')
        .select('*')
        .eq('family_group_id', familyGroupId)
        .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Supabase error fetching locations:', error);
        throw error;
      }
      
      setLocations((data || []).map(location => ({
        ...location,
        status: location.status as 'online' | 'idle' | 'offline'
      })));
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      // Only set error if it's not a network issue (which is common in preview mode)
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
        setError('Failed to fetch family locations');
      }
    }
  }, [familyGroupId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!familyGroupId) return;

    const channel = supabase
      .channel('live-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations',
          filter: `family_group_id=eq.${familyGroupId}`
        },
        (payload) => {
          console.log('Location update:', payload);
          fetchLocations();
        }
      )
      .subscribe();

    // Initial fetch
    fetchLocations();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyGroupId, fetchLocations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      trackingStartedRef.current = false;
    };
  }, []);

  // Manual location refresh
  const refreshLocation = useCallback(async () => {
    if (!user) return;

    try {
      const position = await getCurrentPosition();
      lastLocationRef.current = position;
      
      const success = await updateLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      }, true);

      if (success) {
        toast({
          title: "Location Updated",
          description: "Your location has been refreshed"
        });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to refresh location:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh location');
      return false;
    }
  }, [user, getCurrentPosition, updateLocation, toast]);

  // Get current location without updating database
  const getCurrentLocationData = useCallback((): LiveLocationData | null => {
    if (!lastLocationRef.current || !user) return null;

    const position = lastLocationRef.current;
    return {
      id: user.id,
      user_id: user.id,
      family_group_id: familyGroupId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      battery_level: undefined,
      status: locationState.isTracking ? 'online' : 'idle',
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [user, familyGroupId, locationState.isTracking]);

  return {
    locations,
    locationState,
    metrics,
    error,
    isTracking: locationState.isTracking,
    startTracking,
    stopTracking,
    updateLocation,
    refreshLocation,
    getCurrentLocationData,
    refetch: fetchLocations
  };
};