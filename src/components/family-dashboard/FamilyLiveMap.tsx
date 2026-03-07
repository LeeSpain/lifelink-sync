import React, { useEffect, useMemo, useState } from 'react';
import { useCanvasMap } from '@/hooks/useCanvasMap';
import { useLocationServices } from '@/hooks/useLocationServices';
import { useLiveLocation } from '@/hooks/useLiveLocation';

interface FamilyLiveMapProps {
  className?: string;
  familyGroupId?: string;
}

const FamilyLiveMap: React.FC<FamilyLiveMapProps> = ({ className, familyGroupId }) => {
  const { MapView } = useCanvasMap();
  const { getCurrentLocationData, requestLocationPermission, permissionState, isGettingLocation } = useLocationServices();
  const { locations } = useLiveLocation(familyGroupId);

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(15);

  // Get user's current location on mount
  useEffect(() => {
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
      }
    })();
    return () => { mounted = false; };
  }, [getCurrentLocationData]);

  const markers = useMemo(() => {
    const m: { id: string; lat: number; lng: number; render: () => React.ReactNode }[] = [];

    // Family members markers (if any)
    for (const l of locations || []) {
      m.push({
        id: `member-${l.user_id}`,
        lat: l.latitude,
        lng: l.longitude,
        render: () => (
          <div className="rounded-full bg-primary text-primary-foreground border-2 border-background px-2 py-1 text-[10px] shadow">
            {l.status === 'online' ? '●' : '○'}
          </div>
        )
      });
    }

    return m;
  }, [locations]);

  const handleUseMyLocation = async () => {
    const ok = await requestLocationPermission();
    if (!ok) return;
    const loc = await getCurrentLocationData();
    if (loc) {
      setCenter({ lat: loc.latitude, lng: loc.longitude });
      setZoom(16);
    }
  };

  // Don't render the map until we know where to start to avoid jumping to SF
  const isReady = !!center;

  return (
    <div className={`min-h-[600px] ${className || ''}`}>
      {!isReady && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <p className="text-sm opacity-80">Waiting for your location…</p>
          <button
            onClick={handleUseMyLocation}
            disabled={isGettingLocation}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow transition-opacity disabled:opacity-50"
          >
            {permissionState.granted ? 'Recenter to my location' : 'Use my location'}
          </button>
        </div>
      )}

      {isReady && (
        <MapView
          className="h-full min-h-[600px] w-full"
          markers={markers}
          center={center || undefined}
          zoom={zoom}
          showControls={true}
          interactive={true}
        />
      )}
    </div>
  );
};

export default FamilyLiveMap;