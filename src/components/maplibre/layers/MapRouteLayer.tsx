import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInstance } from '../MapLibreMap';
import { RoutePoint } from '@/types/map';

interface MapRouteLayerProps {
  points: RoutePoint[];
  color?: string;
  showStartEnd?: boolean;
}

const SOURCE_ID = 'route-source';
const LINE_LAYER_ID = 'route-line';

export function MapRouteLayer({ points, color = '#3b82f6', showStartEnd = true }: MapRouteLayerProps) {
  const map = useMapInstance();
  const addedRef = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || points.length < 2) return;

    const coordinates = points.map(p => [p.lng, p.lat] as [number, number]);

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {},
      }],
    };

    if (!addedRef.current) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

      map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      addedRef.current = true;
    } else {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) source.setData(geojson);
    }

    // Clear previous start/end markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (showStartEnd && points.length >= 2) {
      const startPoint = points[0];
      const endPoint = points[points.length - 1];

      const startEl = createEndpointMarker('S', '#22c55e');
      const endEl = createEndpointMarker('E', '#ef4444');

      const startMarker = new maplibregl.Marker({ element: startEl, anchor: 'center' })
        .setLngLat([startPoint.lng, startPoint.lat])
        .addTo(map);
      const endMarker = new maplibregl.Marker({ element: endEl, anchor: 'center' })
        .setLngLat([endPoint.lng, endPoint.lat])
        .addTo(map);

      markersRef.current.push(startMarker, endMarker);
    }
  }, [map, points, color, showStartEnd]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (!map || !addedRef.current) return;
      try {
        if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch { /* map destroyed */ }
      addedRef.current = false;
    };
  }, [map]);

  return null;
}

function createEndpointMarker(label: string, color: string): HTMLElement {
  const el = document.createElement('div');
  el.style.width = '28px';
  el.style.height = '28px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = color;
  el.style.border = '3px solid #ffffff';
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = '#ffffff';
  el.style.fontWeight = '700';
  el.style.fontSize = '12px';
  el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  el.textContent = label;
  return el;
}
