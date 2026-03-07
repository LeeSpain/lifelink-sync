import React, { useEffect, useMemo, useState } from "react";
import { CircleSwitcher } from "@/components/map/CircleSwitcher";
import { MemberPin } from "@/components/map/MemberPin";
import { MemberSheet } from "@/components/map/MemberSheet";
import { useCanvasMap } from "@/hooks/useCanvasMap";
import { useLocationServices } from "@/hooks/useLocationServices";
import { useEnhancedCircleRealtime } from "@/hooks/useEnhancedCircleRealtime";
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Pause, Play, Settings, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Presence = {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
};

export default function MapScreen() {
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Presence | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [sosHoldTimer, setSosHoldTimer] = useState<number | null>(null);
  const [sosProgress, setSosProgress] = useState(0);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(15);
  
  const { MapView } = useCanvasMap();
  const { getCurrentLocationData, requestLocationPermission, permissionState, isGettingLocation } = useLocationServices();
  const { presences, circles, recentEvents, loadInitial, refresh, metrics, connectionHealth } = useEnhancedCircleRealtime(activeCircleId);
  const { permission, isTracking, requestPermission } = useBackgroundLocation(locationEnabled);
  const { toast } = useToast();


  useEffect(() => {
    // Auto-select first circle if available
    if (circles.length > 0 && !activeCircleId) {
      setActiveCircleId(circles[0].id);
    }
  }, [circles, activeCircleId]);

  // Get user's current location on mount (only once)
  useEffect(() => {
    if (center !== null) return; // Already set
    let mounted = true;
    (async () => {
      try {
        const loc = await getCurrentLocationData();
        if (mounted && loc) {
          setCenter({ lat: loc.latitude, lng: loc.longitude });
          setZoom(16);
        }
      } catch (e) {
        console.warn('Unable to fetch current location initially:', e);
        // Fallback to presences center if available
        if (mounted && presences.length > 0) {
          const sums = presences.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
          setCenter({ lat: sums.lat / presences.length, lng: sums.lng / presences.length });
        }
      }
    })();
    return () => { mounted = false; };
  }, [getCurrentLocationData, center, presences]);

  const handleUseMyLocation = async () => {
    const ok = await requestLocationPermission();
    if (!ok) return;
    const loc = await getCurrentLocationData();
    if (loc) {
      setCenter({ lat: loc.latitude, lng: loc.longitude });
      setZoom(16);
    }
  };

  const handleLocationToggle = async () => {
    if (!locationEnabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        setLocationEnabled(true);
      }
    } else {
      setLocationEnabled(!locationEnabled);
    }
  };

  const handleSOSStart = () => {
    const timer = window.setTimeout(() => {
      // Trigger SOS after 3 seconds
      triggerSOS();
      setSosHoldTimer(null);
      setSosProgress(0);
    }, 3000);
    
    setSosHoldTimer(timer);
    
    // Progress animation
    let progress = 0;
    const progressTimer = setInterval(() => {
      progress += 2;
      setSosProgress(progress);
      if (progress >= 100) {
        clearInterval(progressTimer);
      }
    }, 60);
  };

  const handleSOSCancel = () => {
    if (sosHoldTimer) {
      clearTimeout(sosHoldTimer);
      setSosHoldTimer(null);
      setSosProgress(0);
    }
  };

  const triggerSOS = async () => {
    try {
      // Import and use existing SOS hook
      const { useEmergencySOS } = await import("@/hooks/useEmergencySOS");
      const { triggerEmergencySOS } = useEmergencySOS();
      
      await triggerEmergencySOS();
      
      toast({
        title: "🚨 Family SOS Triggered",
        description: "Emergency alert sent to your family circle with current location.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("SOS error:", error);
      toast({
        title: "SOS Failed", 
        description: "Failed to send emergency alert. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full relative bg-background">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 space-y-3">
        <CircleSwitcher
          circles={circles}
          activeId={activeCircleId}
          onChange={setActiveCircleId}
        />
        
        {/* Status Card */}
        <Card className="p-3 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Location Sharing</span>
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {presences.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {presences.length} member{presences.length !== 1 ? 's' : ''} visible
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleLocationToggle}
                className="flex items-center gap-1"
              >
                {isTracking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isTracking ? "Pause" : "Start"}
              </Button>
              
              <Button size="sm" variant="outline" onClick={refresh}>
                <Settings className="w-3 h-3" />
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleUseMyLocation}>
                <Target className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Map */}
      {!center && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <p className="text-sm opacity-80">Waiting for your location…</p>
          <Button
            onClick={handleUseMyLocation}
            disabled={isGettingLocation}
            className="inline-flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            {permissionState.granted ? 'Recenter to my location' : 'Use my location'}
          </Button>
        </div>
      )}

      {center && (
        <MapView
          className="h-full min-h-[600px] w-full"
          markers={presences.map(p => ({
            id: p.user_id,
            lat: p.lat,
            lng: p.lng,
            render: () => (
              <MemberPin
                presence={p}
                onClick={() => setSelectedMember(p)}
              />
            )
          }))}
          center={center}
          zoom={zoom}
          showControls={true}
          interactive={true}
        />
      )}

      {/* SOS Button */}
      <div className="absolute bottom-6 right-6 z-20">
        <div className="relative">
          <Button
            size="lg"
            className={cn(
              "w-16 h-16 rounded-full shadow-xl font-bold text-lg transition-all duration-200",
              sosHoldTimer 
                ? "bg-red-600 hover:bg-red-700 scale-110" 
                : "bg-red-500 hover:bg-red-600"
            )}
            onMouseDown={handleSOSStart}
            onMouseUp={handleSOSCancel}
            onMouseLeave={handleSOSCancel}
            onTouchStart={handleSOSStart}
            onTouchEnd={handleSOSCancel}
          >
            <AlertTriangle className="w-6 h-6" />
          </Button>
          
          {/* Progress ring */}
          {sosHoldTimer && (
            <svg className="absolute inset-0 w-16 h-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-red-200"
                strokeDasharray={`${sosProgress * 1.76} 176`}
              />
            </svg>
          )}
        </div>
        
        <div className="text-center mt-2">
          <div className="text-xs text-muted-foreground">Hold for SOS</div>
        </div>
      </div>

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div className="absolute bottom-6 left-6 z-20">
          <Card className="p-3 bg-background/80 backdrop-blur-sm max-w-xs">
            <div className="text-sm font-medium mb-2">Recent Events</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="text-xs text-muted-foreground">
                  <span className="font-medium">
                    {event.user_id.slice(0, 8)}
                  </span>
                  {' '}
                  {event.event_type === 'enter' ? 'arrived at' : 'left'}
                  {' '}
                  <span className="font-medium">{event.place_name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Member Details Sheet */}
      <MemberSheet
        presence={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}