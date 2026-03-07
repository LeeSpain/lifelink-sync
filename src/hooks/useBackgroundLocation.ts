import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * useBackgroundLocation
 * Adaptive cadence:
 * - moving: every 15-30s
 * - stationary: every 5-10m
 * NOTE: Wire to Capacitor plugins on native; this is a web-friendly placeholder.
 */
export function useBackgroundLocation(enabled: boolean) {
  const [permission, setPermission] = useState<PermissionState | "unsupported">("unsupported");
  const [isTracking, setIsTracking] = useState(false);
  const timer = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }
    
    // Check permission status
    if ("permissions" in navigator) {
      (navigator as any).permissions?.query({ name: "geolocation" as PermissionName })
        .then((p: any) => setPermission(p.state as PermissionState))
        .catch(() => setPermission("prompt"));
    } else {
      setPermission("prompt");
    }
  }, []);

  const recordLocationPing = async (lat: number, lng: number, accuracy?: number, speed?: number) => {
    try {
      const { error } = await supabase.functions.invoke("record-location-ping", {
        body: { lat, lng, accuracy, speed, battery: null }
      });

      if (error) {
        console.error("Failed to record location:", error);
        throw error;
      }

      console.log(`📍 Location recorded: ${lat}, ${lng}`);
    } catch (error) {
      console.error("Location recording error:", error);
      toast({
        title: "Location Error",
        description: "Failed to record location. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!enabled || permission === "denied") {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);

    function tick() {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed } = pos.coords;
          await recordLocationPing(latitude, longitude, accuracy || undefined, speed || undefined);
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setPermission("denied");
            toast({
              title: "Location Permission Denied",
              description: "Please enable location access to use family tracking.",
              variant: "destructive"
            });
          }
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 30000, // 30 seconds
          timeout: 10000 // 10 seconds
        }
      );
      
      // Adaptive interval: 30 seconds for now, can be made smarter based on movement
      timer.current = window.setTimeout(tick, 30_000);
    }

    tick();
    
    return () => { 
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      setIsTracking(false);
    };
  }, [enabled, permission, toast]);

  const requestPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      setPermission("granted");
      toast({
        title: "Location Access Granted",
        description: "Family tracking is now active.",
      });
      
      return true;
    } catch (error) {
      setPermission("denied");
      toast({
        title: "Location Permission Required",
        description: "Please enable location access in your browser settings.",
        variant: "destructive"
      });
      return false;
    }
  };

  return { 
    permission, 
    isTracking, 
    requestPermission 
  };
}