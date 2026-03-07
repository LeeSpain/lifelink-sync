import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  googleMapsLink: string;
  timestamp: string;
}

interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export const useLocationServices = () => {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>({
    granted: false,
    denied: false,
    prompt: false
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState({ granted: false, denied: true, prompt: false });
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionState({
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt'
      });

      result.addEventListener('change', () => {
        setPermissionState({
          granted: result.state === 'granted',
          denied: result.state === 'denied',
          prompt: result.state === 'prompt'
        });
      });
    } catch (error) {
      console.warn('Permissions API not supported, will request location directly');
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      // Using a free geocoding service with better error handling
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.locality && data.countryName 
          ? `${data.locality}, ${data.countryName}`
          : data.city || data.countryName || undefined;
      } else {
        console.warn(`Geocoding API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      // Fallback to coordinate string if geocoding fails
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return undefined;
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast({
          title: "Location Not Supported",
          description: "Your device doesn't support location services.",
          variant: "destructive"
        });
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionState(prev => ({ ...prev, granted: true }));
          toast({
            title: "Location Access Granted",
            description: "Emergency SOS can now share your precise location.",
          });
          resolve(true);
        },
        (error) => {
          setPermissionState(prev => ({ ...prev, denied: true }));
          
          let message = "Location access was denied.";
          if (error.code === error.PERMISSION_DENIED) {
            message = "Location permission denied. Enable in browser settings for emergency SOS.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = "Location is currently unavailable.";
          } else if (error.code === error.TIMEOUT) {
            message = "Location request timed out.";
          }
          
          toast({
            title: "Location Access Required",
            description: message,
            variant: "destructive"
          });
          resolve(false);
        },
        { timeout: 5000 }
      );
    });
  };

  const getCurrentLocationData = async (): Promise<LocationData | null> => {
    if (isGettingLocation) return null;

    setIsGettingLocation(true);
    
    try {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const timestamp = new Date().toISOString();
            
            // Generate Google Maps link
            const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            
            // Try to get human-readable address
            const address = await reverseGeocode(latitude, longitude);
            
            const locationData: LocationData = {
              latitude,
              longitude,
              accuracy,
              address,
              googleMapsLink,
              timestamp
            };

            resolve(locationData);
          },
          (error) => {
            console.error('Location error:', error);
            let message = 'Failed to get location';
            
            if (error.code === error.PERMISSION_DENIED) {
              message = 'Location permission denied';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location unavailable';
            } else if (error.code === error.TIMEOUT) {
              message = 'Location request timed out';
            }
            
            reject(new Error(message));
          },
          { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 30000 
          }
        );
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const formatLocationForEmergency = (locationData: LocationData): string => {
    const { latitude, longitude, address, accuracy } = locationData;
    
    let locationString = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    
    if (address) {
      locationString = `${address} (${locationString})`;
    }
    
    if (accuracy) {
      locationString += ` [±${Math.round(accuracy)}m accuracy]`;
    }
    
    return locationString;
  };

  return {
    permissionState,
    isGettingLocation,
    requestLocationPermission,
    getCurrentLocationData,
    formatLocationForEmergency,
    checkLocationPermission
  };
};