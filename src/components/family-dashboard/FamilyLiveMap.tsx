import React, { useEffect, useMemo, useState } from 'react';
import { useLocationServices } from '@/hooks/useLocationServices';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import MapLibreMap from '@/components/maplibre/MapLibreMap';
import { MapMemberLayer } from '@/components/maplibre/layers/MapMemberLayer';
import { MapEntity, getStatusFromPresence } from '@/types/map';
import { useTranslation } from 'react-i18next';

interface FamilyLiveMapProps {
  className?: string;
  familyGroupId?: string;
}

const FamilyLiveMap: React.FC<FamilyLiveMapProps> = ({ className, familyGroupId }) => {
  const { t } = useTranslation();
  const { getCurrentLocationData, requestLocationPermission, permissionState, isGettingLocation } = useLocationServices();
  const { locations } = useLiveLocation(familyGroupId);

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(15);

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

  const memberEntities: MapEntity[] = useMemo(() =>
    (locations || []).map(l => ({
      id: `member-${l.user_id}`,
      type: 'member' as const,
      lat: l.latitude,
      lng: l.longitude,
      label: l.user_id.slice(0, 8),
      status: getStatusFromPresence(undefined, false),
      battery: l.battery_level,
    })),
  [locations]);

  const handleUseMyLocation = async () => {
    const ok = await requestLocationPermission();
    if (!ok) return;
    const loc = await getCurrentLocationData();
    if (loc) {
      setCenter({ lat: loc.latitude, lng: loc.longitude });
      setZoom(16);
    }
  };

  const isReady = !!center;

  return (
    <div className={`min-h-[600px] ${className || ''}`}>
      {!isReady && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <p className="text-sm opacity-80">{t('familyDashboard.waitingForLocation')}</p>
          <button
            onClick={handleUseMyLocation}
            disabled={isGettingLocation}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow transition-opacity disabled:opacity-50"
          >
            {permissionState.granted ? t('familyDashboard.recenterLocation') : t('familyDashboard.useMyLocation')}
          </button>
        </div>
      )}

      {isReady && (
        <MapLibreMap className="h-full min-h-[600px] w-full" center={center!} zoom={zoom} interactive={true}>
          <MapMemberLayer members={memberEntities} />
        </MapLibreMap>
      )}
    </div>
  );
};

export default FamilyLiveMap;
