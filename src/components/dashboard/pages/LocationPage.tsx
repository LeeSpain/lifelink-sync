import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Shield, Clock, Plus, Navigation, Home, Briefcase, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function LocationPage() {
  const [locationSharing, setLocationSharing] = useState(true);
  const [emergencySharing, setEmergencySharing] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLocationSettings();
  }, []);

  const loadLocationSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('location_sharing_enabled')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setLocationSharing(data.location_sharing_enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading location settings:', error);
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "Loading address...",
            lastUpdated: "Just now"
          });
          setIsLoadingLocation(false);
          
          // Reverse geocode to get address
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
          toast({
            title: "Location Error",
            description: "Unable to get your current location. Please check location permissions.",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: "Location Unavailable",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using a simple geocoding service (you can integrate with Google Maps API or similar)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      setCurrentLocation(prev => ({
        ...prev,
        address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }));
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setCurrentLocation(prev => ({
        ...prev,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }));
    }
  };

  const updateLocationSharing = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ location_sharing_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setLocationSharing(enabled);
      toast({
        title: "Settings Updated",
        description: `Location sharing ${enabled ? 'enabled' : 'disabled'} successfully.`
      });
    } catch (error) {
      console.error('Error updating location sharing:', error);
      toast({
        title: "Error",
        description: "Failed to update location sharing settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="h-6 w-6 text-primary" />
              Location Services
            </CardTitle>
            <CardDescription className="text-base">
              Manage your location sharing and safe zones
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" />
              Privacy & Sharing Settings
            </CardTitle>
            <CardDescription className="text-sm">
              Control how your location is shared with family members and emergency services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base">Share Location with Family</h3>
                <p className="text-sm text-muted-foreground">
                  Allow family members to see your current location
                </p>
              </div>
              <Switch 
                checked={locationSharing} 
                onCheckedChange={updateLocationSharing}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base">Emergency Location Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically share location during emergency situations
                </p>
              </div>
              <Switch 
                checked={emergencySharing} 
                onCheckedChange={setEmergencySharing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{currentLocation.address}</h3>
                  <p className="text-sm text-muted-foreground">
                    Coordinates: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Last updated: {currentLocation.lastUpdated}
                    </span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">Location Not Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get your current location to enable location services
                </p>
                <Button 
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoadingLocation ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Current Location
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safe Zones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Home className="h-5 w-5" />
                  Safe Zones
                </CardTitle>
                <CardDescription className="text-sm">
                  Designated areas where family members receive arrival/departure notifications
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No Safe Zones Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create safe zones to get notifications when family members arrive or leave
              </p>
              <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Safe Zone
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5" />
              Recent Location History
            </CardTitle>
            <CardDescription className="text-sm">
              Your recent location visits and duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No Location History</h3>
              <p className="text-sm text-muted-foreground">
                Location history will appear here once you enable location tracking
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}