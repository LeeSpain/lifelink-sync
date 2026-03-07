import { useMemo } from 'react';
import MapLibreMap from '@/components/maplibre/MapLibreMap';
import { PLATFORM_MAP_CONFIG } from '@/config/mapConfig';

/**
 * @deprecated Use MapLibreMap directly instead of useCanvasMap.
 * This hook is maintained for backward compatibility during the MapLibre migration.
 * All new code should import MapLibreMap and map layer components directly.
 */

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  render: () => React.ReactNode;
}

interface MapViewProps {
  className?: string;
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapReady?: () => void;
  showControls?: boolean;
  interactive?: boolean;
}

export const useCanvasMap = () => {
  const MapView = useMemo(() => {
    return ({ className, markers = [], center, zoom = PLATFORM_MAP_CONFIG.defaultZoom, onMapReady, showControls = true, interactive = true }: MapViewProps) => {
      return (
        <MapLibreMap
          className={className}
          center={center || PLATFORM_MAP_CONFIG.defaultCenter}
          zoom={zoom}
          interactive={interactive}
          onMapReady={onMapReady ? () => onMapReady() : undefined}
        />
      );
    };
  }, []);

  return {
    MapView,
    isLoading: false,
    error: null
  };
};
