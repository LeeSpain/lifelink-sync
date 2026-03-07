import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInstance } from '../MapLibreMap';
import { IncidentEntity } from '@/types/map';

interface MapIncidentLayerProps {
  incidents: IncidentEntity[];
  onIncidentClick?: (incident: IncidentEntity) => void;
}

export function MapIncidentLayer({ incidents, onIncidentClick }: MapIncidentLayerProps) {
  const map = useMapInstance();
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const currentMarkers = markersRef.current;
    const activeIds = new Set(incidents.map(i => i.id));

    // Remove stale markers
    for (const [id, marker] of currentMarkers) {
      if (!activeIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add/update markers
    for (const incident of incidents) {
      const existing = currentMarkers.get(incident.id);
      if (existing) {
        existing.setLngLat([incident.lng, incident.lat]);
      } else {
        const el = createIncidentElement(incident);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onIncidentClick?.(incident);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([incident.lng, incident.lat])
          .addTo(map);
        currentMarkers.set(incident.id, marker);
      }
    }
  }, [map, incidents]);

  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
    };
  }, []);

  return null;
}

function createIncidentElement(incident: IncidentEntity): HTMLElement {
  const isActive = incident.status === 'active';
  const el = document.createElement('div');
  el.style.width = '36px';
  el.style.height = '36px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = isActive ? '#ef4444' : '#f59e0b';
  el.style.border = '3px solid #ffffff';
  el.style.boxShadow = isActive
    ? '0 0 0 4px rgba(239,68,68,0.4), 0 4px 12px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.3)';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = '#ffffff';
  el.style.fontWeight = '700';
  el.style.fontSize = '16px';
  el.style.cursor = 'pointer';
  el.style.zIndex = '20';
  el.textContent = '!';

  if (isActive) {
    el.style.animation = 'marker-pulse 1.2s ease-in-out infinite';
  }

  return el;
}
