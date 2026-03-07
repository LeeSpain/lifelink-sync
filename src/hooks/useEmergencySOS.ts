import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocationServices } from '@/hooks/useLocationServices';
import { withNetworkErrorHandling } from '@/utils/networkErrorHandler';

interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

interface EmergencySOSData {
  userProfile: {
    first_name: string;
    last_name: string;
    emergency_contacts: EmergencyContact[];
  };
  location: string;
  locationData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    googleMapsLink: string;
  };
  timestamp: string;
}

export const useEmergencySOS = () => {
  const [isTriggering, setIsTriggering] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCurrentLocationData, formatLocationForEmergency, permissionState } = useLocationServices();

  const getEnhancedLocation = async () => {
    try {
      const locationData = await getCurrentLocationData();
      if (locationData) {
        return {
          locationString: formatLocationForEmergency(locationData),
          locationData: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy,
            address: locationData.address,
            googleMapsLink: locationData.googleMapsLink
          }
        };
      }
    } catch (error) {
      console.error('Enhanced location failed:', error);
    }
    
    // Fallback to basic location
    return new Promise<{ locationString: string; locationData?: undefined }>((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ 
              locationString: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
            });
          },
          (error) => {
            console.error('Location error:', error);
            resolve({ locationString: 'Location unavailable' });
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        resolve({ locationString: 'Geolocation not supported' });
      }
    });
  };

  const getUserProfile = async (): Promise<{
    first_name: string;
    last_name: string;
    emergency_contacts: EmergencyContact[];
  }> => {
    if (!user) throw new Error('User not authenticated');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, emergency_contacts')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!profile) throw new Error('Profile not found');

    // Ensure emergency_contacts is an array and properly typed
    const emergencyContacts: EmergencyContact[] = Array.isArray(profile.emergency_contacts) 
      ? (profile.emergency_contacts as any[]).map(contact => ({
          name: contact.name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          relationship: contact.relationship || ''
        }))
      : [];

    return {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      emergency_contacts: emergencyContacts
    };
  };

  const triggerEmergencySOS = async () => {
    if (isTriggering) return;

    setIsTriggering(true);
    
    try {
      console.log('🚨 Triggering Emergency SOS...');
      
      // Check location permission first
      if (!permissionState.granted && permissionState.denied) {
        throw new Error('Location permission required for emergency SOS. Please enable location access in your browser settings.');
      }

      // Get user profile and enhanced location
      const [profile, locationResult] = await Promise.all([
        getUserProfile(),
        getEnhancedLocation()
      ]);

      if (!profile.emergency_contacts || profile.emergency_contacts.length === 0) {
        throw new Error('No emergency contacts configured. Please add emergency contacts in your profile settings.');
      }

      const emergencyData: EmergencySOSData = {
        userProfile: profile,
        location: locationResult.locationString,
        locationData: locationResult.locationData,
        timestamp: new Date().toISOString()
      };

      // Call emergency SOS function with error handling
      const result = await withNetworkErrorHandling(async () => {
        const { data, error } = await supabase.functions.invoke('emergency-sos-enhanced', {
          body: emergencyData
        });

        if (error) {
          console.error('Emergency SOS Error:', error);
          throw error;
        }

        return data;
      }, 'Emergency SOS');

      if (!result) {
        throw new Error('Emergency SOS failed - please try again or call emergency services directly');
      }

      console.log('✅ Emergency SOS triggered successfully:', result);
      
      toast({
        title: "🚨 Emergency SOS Activated",
        description: `Emergency notifications sent to ${result.summary?.emails_sent || 0} contacts. ${result.summary?.calls_initiated || 0} calls initiated.`,
        variant: "destructive"
      });

      return result;

    } catch (error: any) {
      console.error('❌ Emergency SOS failed:', error);
      
      toast({
        title: "Emergency SOS Failed", 
        description: error.message || 'Failed to trigger emergency SOS. Please try again or call emergency services directly.',
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsTriggering(false);
    }
  };

  return {
    triggerEmergencySOS,
    isTriggering,
    locationPermissionGranted: permissionState.granted,
    locationPermissionDenied: permissionState.denied
  };
};