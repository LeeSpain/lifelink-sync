import { useMemo } from 'react';
import { useCanvasMap } from './useCanvasMap';
import { PLATFORM_MAP_CONFIG } from '@/config/mapConfig';

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
  preferCanvas?: boolean; // Kept for compatibility but always uses Canvas
}

export const useUnifiedMap = () => {
  const { MapView: CanvasMapView, isLoading, error } = useCanvasMap();

  // Memoize the MapView component to prevent unnecessary re-renders
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

  // Return a simplified interface that always uses Canvas
  return {
    MapView,
    isLoading,
    error,
    hasMapboxToken: false, // Always false since we removed Mapbox
    currentBackend: 'canvas' as const,
    switchToCanvas: () => CanvasMapView, // No-op, already using Canvas
    switchToMapbox: () => CanvasMapView, // No-op, fallback to Canvas
  };
};