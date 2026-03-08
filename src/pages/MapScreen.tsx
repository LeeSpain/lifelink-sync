import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { CircleSwitcher } from "@/components/map/CircleSwitcher";
import { MemberSheet } from "@/components/map/MemberSheet";
import { useLocationServices } from "@/hooks/useLocationServices";
import { useEnhancedCircleRealtime } from "@/hooks/useEnhancedCircleRealtime";
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";
import MapLibreMap, { MapLibreMapRef } from "@/components/maplibre/MapLibreMap";
import { MapMemberLayer } from "@/components/maplibre/layers/MapMemberLayer";
import { MapSearchControl } from "@/components/maplibre/MapSearchControl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Pause, Play, Settings, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MapEntity, getStatusFromPresence } from "@/types/map";

type Presence = {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};

export default function MapScreen() {
  const { t } = useTranslation();
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Presence | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [sosHoldTimer, setSosHoldTimer] = useState<number | null>(null);
  const [sosProgress, setSosProgress] = useState(0);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(15);

  const mapRef = useRef<MapLibreMapRef>(null);
  const { getCurrentLocationData, requestLocationPermission, permissionState, isGettingLocation } = useLocationServices();
  const { presences, circles, recentEvents, loadInitial, refresh, metrics, connectionHealth } = useEnhancedCircleRealtime(activeCircleId);
  const { permission, isTracking, requestPermission } = useBackgroundLocation(locationEnabled);
  const { toast } = useToast();

  useEffect(() => {
    if (circles.length > 0 && !activeCircleId) {
      setActiveCircleId(circles[0].id);
    }
  }, [circles, activeCircleId]);

  useEffect(() => {
    if (center !== null) return;
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
      const newCenter = { lat: loc.latitude, lng: loc.longitude };
      setCenter(newCenter);
      setZoom(16);
      mapRef.current?.flyTo(newCenter, 16);
    }
  };

  const handleLocationToggle = async () => {
    if (!locationEnabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) setLocationEnabled(true);
    } else {
      setLocationEnabled(!locationEnabled);
    }
  };

  const handleSearchLocation = useCallback((lat: number, lng: number, _name: string) => {
    mapRef.current?.flyTo({ lat, lng }, 16);
  }, []);

  const handleSOSStart = () => {
    const timer = window.setTimeout(() => {
      triggerSOS();
      setSosHoldTimer(null);
      setSosProgress(0);
    }, 3000);
    setSosHoldTimer(timer);
    let progress = 0;
    const progressTimer = setInterval(() => {
      progress += 2;
      setSosProgress(progress);
      if (progress >= 100) clearInterval(progressTimer);
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
      const { useEmergencySOS } = await import("@/hooks/useEmergencySOS");
      const { triggerEmergencySOS } = useEmergencySOS();
      await triggerEmergencySOS();
      toast({
        title: t('map.sosTriggered'),
        description: t('map.sosDescription'),
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

  const memberEntities: MapEntity[] = useMemo(() =>
    presences.map(p => ({
      id: p.user_id,
      type: 'member' as const,
      lat: p.lat,
      lng: p.lng,
      label: p.user_id.slice(0, 8),
      status: getStatusFromPresence(p.last_seen, p.is_paused),
      battery: p.battery,
      last_seen: p.last_seen,
      is_paused: p.is_paused,
      first_name: (p as Presence).first_name,
      last_name: (p as Presence).last_name,
      avatar_url: (p as Presence).avatar_url,
    })),
  [presences]);

  const handleMemberClick = useCallback((entity: MapEntity) => {
    const p = presences.find(pr => pr.user_id === entity.id);
    if (p) setSelectedMember(p);
  }, [presences]);

  return (
    <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-full relative bg-background overflow-hidden">
      {/* Top Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2">
        {/* Circle switcher + status bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <CircleSwitcher circles={circles} activeId={activeCircleId} onChange={setActiveCircleId} />
          <Badge variant={isTracking ? "default" : "secondary"} className="text-xs shrink-0">
            {isTracking ? "Sharing On" : "Sharing Off"}
          </Badge>
          {presences.length > 0 && (
            <Badge variant="outline" className="text-xs shrink-0">
              {presences.length} member{presences.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Compact action bar */}
        <div className="flex items-center gap-2">
          <MapSearchControl onLocationSelect={handleSearchLocation} className="flex-1 max-w-xs" />
          <div className="flex items-center gap-1">
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-sm" onClick={handleLocationToggle} title={isTracking ? "Pause sharing" : "Start sharing"}>
              {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-sm" onClick={handleUseMyLocation} title="My location">
              <Target className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-sm" onClick={refresh} title="Refresh">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!center && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <p className="text-sm opacity-80">Waiting for your location...</p>
          <Button onClick={handleUseMyLocation} disabled={isGettingLocation} className="inline-flex items-center gap-2">
            <Target className="w-4 h-4" />
            {permissionState.granted ? 'Recenter to my location' : 'Use my location'}
          </Button>
        </div>
      )}

      {/* MapLibre Map - fills entire container */}
      {center && (
        <MapLibreMap ref={mapRef} className="absolute inset-0" center={center} zoom={zoom} interactive={true}>
          <MapMemberLayer members={memberEntities} onMemberClick={handleMemberClick} selectedId={selectedMember?.user_id} />
        </MapLibreMap>
      )}

      {/* SOS Button */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="relative">
          <Button
            size="lg"
            className={cn(
              "w-14 h-14 rounded-full shadow-xl font-bold text-lg transition-all duration-200",
              sosHoldTimer ? "bg-red-600 hover:bg-red-700 scale-110" : "bg-red-500 hover:bg-red-600"
            )}
            onMouseDown={handleSOSStart} onMouseUp={handleSOSCancel} onMouseLeave={handleSOSCancel}
            onTouchStart={handleSOSStart} onTouchEnd={handleSOSCancel}
          >
            <AlertTriangle className="w-5 h-5" />
          </Button>
          {sosHoldTimer && (
            <svg className="absolute inset-0 w-14 h-14 -rotate-90 pointer-events-none">
              <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="none" className="text-red-200" strokeDasharray={`${sosProgress * 1.51} 151`} />
            </svg>
          )}
        </div>
        <div className="text-center mt-1"><span className="text-[10px] text-muted-foreground font-medium bg-background/70 px-1.5 py-0.5 rounded">Hold for SOS</span></div>
      </div>

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div className="absolute bottom-4 left-3 z-20 max-w-[240px]">
          <Card className="p-2.5 bg-background/85 backdrop-blur-sm shadow-lg border-border/50">
            <div className="text-xs font-semibold mb-1.5 text-foreground">Recent</div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {recentEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="text-[11px] text-muted-foreground leading-tight">
                  <span className="font-medium text-foreground">{event.user_id.slice(0, 8)}</span>
                  {' '}{event.event_type === 'enter' ? 'arrived at' : 'left'}{' '}
                  <span className="font-medium">{event.place_name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <MemberSheet presence={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}
