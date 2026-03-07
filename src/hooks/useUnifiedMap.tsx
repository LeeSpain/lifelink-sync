import { useMemo } from 'react';
import { useCanvasMap } from './useCanvasMap';
import { PLATFORM_MAP_CONFIG } from '@/config/mapConfig';

/**
 * @deprecated Use MapLibreMap directly instead of useUnifiedMap.
 * This hook is maintained for backward compatibility during the MapLibre migration.
 * All new code should import MapLibreMap and map layer components directly.
 */

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  render: () => React.ReactNode;
}

interface UnifiedMapViewProps {
  className?: string;
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapReady?: () => void;
  showControls?: boolean;
  interactive?: boolean;
  preferCanvas?: boolean;
}

export const useUnifiedMap = () => {
  const { MapView: CanvasMapView, isLoading, error } = useCanvasMap();

  const MapView = useMemo(() => {
    return ({ className, markers = [], center, zoom = PLATFORM_MAP_CONFIG.defaultZoom, onMapReady, showControls = true, interactive = true }: UnifiedMapViewProps) => {
      return (
        <CanvasMapView
          className={className}
          markers={markers}
          center={center || PLATFORM_MAP_CONFIG.defaultCenter}
          zoom={zoom}
          onMapReady={onMapReady}
          showControls={showControls}
          interactive={interactive}
        />
      );
    };
  }, [CanvasMapView]);

  return {
    MapView,
    isLoading,
    error,
    hasMapboxToken: false,
    currentBackend: 'maplibre' as const,
    switchToCanvas: () => CanvasMapView,
    switchToMapbox: () => CanvasMapView,
  };
};
