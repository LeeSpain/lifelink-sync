import { useMemo } from 'react';
import CanvasMap from '@/components/canvas-map/CanvasMap';
import { PLATFORM_MAP_CONFIG } from '@/config/mapConfig';

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
  // Memoize the MapView component to prevent unnecessary re-renders
  const MapView = useMemo(() => {
    return ({ className, markers = [], center, zoom = PLATFORM_MAP_CONFIG.defaultZoom, onMapReady, showControls = true, interactive = true }: MapViewProps) => {
      return (
        <CanvasMap
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
  }, []);

  return {
    MapView,
    isLoading: false,
    error: null
  };
};