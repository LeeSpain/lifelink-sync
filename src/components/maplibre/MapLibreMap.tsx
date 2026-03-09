import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PLATFORM_MAP_CONFIG } from '@/config/mapConfig';
import { cn } from '@/lib/utils';

export interface MapLibreMapRef {
  getMap: () => maplibregl.Map | null;
  flyTo: (center: { lat: number; lng: number }, zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]], options?: maplibregl.FitBoundsOptions) => void;
}

export interface MapLibreMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  mapStyle?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  onMapClick?: (e: maplibregl.MapMouseEvent) => void;
  onMoveEnd?: (center: { lat: number; lng: number }, zoom: number) => void;
  children?: React.ReactNode;
}

// Free high-quality raster tile styles
const DEFAULT_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'LifeLink Command Centre',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'LifeLink Dark',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const MAP_STYLES = {
  standard: DEFAULT_STYLE,
  dark: DARK_STYLE,
} as const;

const MapLibreMap = forwardRef<MapLibreMapRef, MapLibreMapProps>(({
  className,
  center,
  zoom,
  minZoom,
  maxZoom,
  interactive = true,
  mapStyle,
  onMapReady,
  onMapClick,
  onMoveEnd,
  children,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const defaultCenter = center || PLATFORM_MAP_CONFIG.defaultCenter;
  const defaultZoom = zoom ?? PLATFORM_MAP_CONFIG.defaultZoom;

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    flyTo: (c, z) => {
      mapRef.current?.flyTo({
        center: [c.lng, c.lat],
        zoom: z ?? mapRef.current.getZoom(),
        duration: 1500,
      });
    },
    fitBounds: (bounds, options) => {
      mapRef.current?.fitBounds(bounds, { padding: 60, ...options });
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle ? MAP_STYLES[mapStyle as keyof typeof MAP_STYLES] || DEFAULT_STYLE : DEFAULT_STYLE,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultZoom,
      minZoom: minZoom ?? PLATFORM_MAP_CONFIG.minZoom,
      maxZoom: maxZoom ?? PLATFORM_MAP_CONFIG.maxZoom,
      interactive,
      attributionControl: true,
    });

    // Add navigation controls
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 150 }), 'bottom-left');
    }

    map.on('load', () => {
      setMapLoaded(true);
      onMapReady?.(map);
    });

    if (onMapClick) {
      map.on('click', onMapClick);
    }

    if (onMoveEnd) {
      map.on('moveend', () => {
        const c = map.getCenter();
        onMoveEnd({ lat: c.lat, lng: c.lng }, map.getZoom());
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update center/zoom when props change
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const currentCenter = mapRef.current.getCenter();
    const dist = Math.abs(currentCenter.lat - center.lat) + Math.abs(currentCenter.lng - center.lng);
    if (dist > 0.0001) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: zoom ?? mapRef.current.getZoom(),
        duration: 1200,
      });
    }
  }, [center?.lat, center?.lng, zoom]);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {mapLoaded && children && (
        <MapContext.Provider value={mapRef.current}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
});

MapLibreMap.displayName = 'MapLibreMap';

// Context to share map instance with child layers
export const MapContext = React.createContext<maplibregl.Map | null>(null);

export function useMapInstance() {
  const map = React.useContext(MapContext);
  return map;
}

export default MapLibreMap;
