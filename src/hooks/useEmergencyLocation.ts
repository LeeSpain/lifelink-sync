import { useState, useCallback, useEffect } from 'react';
import { useLocationServices } from '@/hooks/useLocationServices';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

interface UseEmergencyLocationReturn {
  currentLocation: LocationData | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  refreshLocation: () => Promise<void>;
  locationError: string | null;
}

export const useEmergencyLocation = (): UseEmergencyLocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { getCurrentLocationData, permissionState } = useLocationServices();
  const { toast } = useToast();

  // Stable refresh function without dependency loops
  const refreshLocation = useCallback(async () => {
    if (!permissionState?.granted) {
      setLocationError('Location permission not granted');
      return;
    }

    try {
      setLocationError(null);
      const locationData = await getCurrentLocationData();
      
      if (locationData?.latitude && locationData?.longitude) {
        const newLocation: LocationData = {
          lat: locationData.latitude,
          lng: locationData.longitude,
          accuracy: locationData.accuracy || 10,
          timestamp: new Date()
        };
        
        // Update location - let the map handle stability
        setCurrentLocation(newLocation);
        return;
      }
      
      throw new Error('No location data received');
    } catch (error) {
      console.error('Emergency Location: Failed to get location:', error);
      setLocationError('Failed to get current location');
      
      // Use default location only once if we don't have any location yet
      setCurrentLocation(prev => {
        if (!prev) {
          return {
            lat: 37.3881024, // Albox, Spain from logs
            lng: -2.1417503,
            accuracy: 0,
            timestamp: new Date()
          };
        }
        return prev;
      });
    }
  }, [getCurrentLocationData, permissionState?.granted]);

  const startTracking = useCallback(() => {
    if (!permissionState?.granted) {
      toast({
        title: "Location Permission Required",
        description: "Please enable location services for emergency tracking",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    refreshLocation();

    // Update location every 30 seconds for emergency tracking
    const interval = setInterval(() => {
      refreshLocation();
    }, 30000);

    return () => {
      clearInterval(interval);
      setIsTracking(false);
    };
  }, [permissionState, refreshLocation, toast]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  // Initial location fetch only once
  useEffect(() => {
    if (!currentLocation && permissionState?.granted) {
      refreshLocation();
    }
  }, [permissionState?.granted]); // Removed refreshLocation to prevent loops

  return {
    currentLocation,
    isTracking,
    startTracking,
    stopTracking,
    refreshLocation,
    locationError
  };
};

export default useEmergencyLocation;