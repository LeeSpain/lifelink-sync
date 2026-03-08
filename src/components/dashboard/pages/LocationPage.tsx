import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Shield, Clock, Plus, Navigation, Home, Briefcase, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export function LocationPage() {
  const { t } = useTranslation();
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
            title: t('location.locationError'),
            description: t('location.unableToGetLocation'),
            variant: "destructive"
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: t('location.locationUnavailable'),
        description: t('location.geolocationNotSupported'),
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
        title: t('location.settingsUpdated'),
        description: enabled ? t('location.sharingEnabled') : t('location.sharingDisabled')
      });
    } catch (error) {
      console.error('Error updating location sharing:', error);
      toast({
        title: t('location.error'),
        description: t('location.failedToUpdateSettings'),
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('location.title')}</h1>
          <p className="text-muted-foreground">{t('location.subtitle')}</p>
        </div>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('location.privacySharing')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('location.privacySharingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base">{t('location.shareWithFamily')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('location.shareWithFamilyDescription')}
                </p>
              </div>
              <Switch 
                checked={locationSharing} 
                onCheckedChange={updateLocationSharing}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base">{t('location.emergencySharing')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('location.emergencySharingDescription')}
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
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('location.currentLocation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="flex items-start gap-4">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Navigation className="h-5 w-5 text-primary" />
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
                <Badge variant="secondary">
                  {t('location.active')}
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">{t('location.locationNotAvailable')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('location.getLocationToEnable')}
                </p>
                <Button
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  size="sm"
                >
                  {isLoadingLocation ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      {t('location.gettingLocation')}
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      {t('location.getCurrentLocation')}
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
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  {t('location.safeZones')}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('location.safeZonesDescription')}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('location.addZone')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">{t('location.noSafeZones')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('location.createSafeZonesDescription')}
              </p>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('location.createFirstSafeZone')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('location.recentHistory')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('location.recentHistoryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">{t('location.noHistory')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('location.noHistoryDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}