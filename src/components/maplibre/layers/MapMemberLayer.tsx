import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInstance } from '../MapLibreMap';
import { MapEntity, STATUS_COLORS, getStatusFromPresence, getUrgencyFromStatus } from '@/types/map';

interface MapMemberLayerProps {
  members: MapEntity[];
  onMemberClick?: (member: MapEntity) => void;
  selectedId?: string | null;
  enableClustering?: boolean;
}

const CLUSTER_SOURCE_ID = 'members-source';
const CLUSTER_LAYER_ID = 'member-clusters';
const CLUSTER_COUNT_LAYER_ID = 'member-cluster-count';
const UNCLUSTERED_LAYER_ID = 'member-unclustered';

export function MapMemberLayer({ members, onMemberClick, selectedId, enableClustering = false }: MapMemberLayerProps) {
  const map = useMapInstance();
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const sourceAddedRef = useRef(false);

  // For clustering mode
  useEffect(() => {
    if (!map || !enableClustering) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: members.map(m => {
        const status = m.status || getStatusFromPresence(m.last_seen, m.is_paused);
        const urgency = getUrgencyFromStatus(status);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
          properties: {
            id: m.id,
            label: m.label || m.first_name || m.id.slice(0, 8),
            status,
            urgency,
            color: STATUS_COLORS[urgency],
            battery: m.battery ?? null,
          },
        };
      }),
    };

    if (!sourceAddedRef.current) {
      map.addSource(CLUSTER_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: CLUSTER_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#3b82f6', 5,
            '#f59e0b', 15,
            '#ef4444'
          ],
          'circle-radius': ['step', ['get', 'point_count'], 22, 5, 28, 15, 34],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      // Cluster count labels
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: CLUSTER_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Unclustered point circles
      map.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: 'circle',
        source: CLUSTER_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Click on cluster to zoom in
      map.on('click', CLUSTER_LAYER_ID, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: coords as [number, number], zoom: zoom! });
        });
      });

      // Click on unclustered point
      map.on('click', UNCLUSTERED_LAYER_ID, (e) => {
        const feature = e.features?.[0];
        if (feature) {
          const member = members.find(m => m.id === feature.properties?.id);
          if (member && onMemberClick) onMemberClick(member);
        }
      });

      // Cursor pointer on hover
      map.on('mouseenter', CLUSTER_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', CLUSTER_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', UNCLUSTERED_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', UNCLUSTERED_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });

      sourceAddedRef.current = true;
    } else {
      // Update existing source data
      const source = map.getSource(CLUSTER_SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) source.setData(geojson);
    }

    return () => {
      // Cleanup on unmount only
    };
  }, [map, members, enableClustering]);

  // Cleanup cluster layers on unmount
  useEffect(() => {
    return () => {
      if (!map || !sourceAddedRef.current) return;
      try {
        if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) map.removeLayer(CLUSTER_COUNT_LAYER_ID);
        if (map.getLayer(CLUSTER_LAYER_ID)) map.removeLayer(CLUSTER_LAYER_ID);
        if (map.getLayer(UNCLUSTERED_LAYER_ID)) map.removeLayer(UNCLUSTERED_LAYER_ID);
        if (map.getSource(CLUSTER_SOURCE_ID)) map.removeSource(CLUSTER_SOURCE_ID);
      } catch {
        // Map may already be destroyed
      }
      sourceAddedRef.current = false;
    };
  }, [map]);

  // For non-clustering mode: use DOM markers for richer display
  useEffect(() => {
    if (!map || enableClustering) return;

    const currentMarkers = markersRef.current;
    const activeIds = new Set(members.map(m => m.id));

    // Remove stale markers
    for (const [id, marker] of currentMarkers) {
      if (!activeIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    for (const member of members) {
      const status = member.status || getStatusFromPresence(member.last_seen, member.is_paused);
      const urgency = getUrgencyFromStatus(status);
      const color = STATUS_COLORS[urgency];
      const isSelected = selectedId === member.id;
      const isUrgent = urgency === 'urgent';
      const initials = getInitials(member);

      const existing = currentMarkers.get(member.id);
      if (existing) {
        // Update position
        existing.setLngLat([member.lng, member.lat]);
        // Update element
        const el = existing.getElement();
        updateMarkerElement(el, { color, initials, isSelected, isUrgent, status, battery: member.battery, avatar_url: member.avatar_url });
      } else {
        // Create new marker
        const el = createMarkerElement({ color, initials, isSelected, isUrgent, status, battery: member.battery, avatar_url: member.avatar_url });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMemberClick?.(member);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([member.lng, member.lat])
          .addTo(map);

        currentMarkers.set(member.id, marker);
      }
    }
  }, [map, members, selectedId, enableClustering]);

  // Cleanup non-cluster markers on unmount
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) {
        marker.remove();
      }
      markersRef.current.clear();
    };
  }, []);

  return null;
}

function getInitials(entity: MapEntity): string {
  if (entity.first_name && entity.last_name) {
    return `${entity.first_name[0]}${entity.last_name[0]}`.toUpperCase();
  }
  if (entity.first_name) return entity.first_name[0].toUpperCase();
  if (entity.label) return entity.label.slice(0, 2).toUpperCase();
  return entity.id.slice(0, 2).toUpperCase();
}

interface MarkerStyle {
  color: string;
  initials: string;
  isSelected: boolean;
  isUrgent: boolean;
  status: string;
  battery?: number | null;
  avatar_url?: string;
}

function createMarkerElement(style: MarkerStyle): HTMLElement {
  const el = document.createElement('div');
  el.className = 'maplibre-member-marker';
  updateMarkerElement(el, style);
  return el;
}

function updateMarkerElement(el: HTMLElement, style: MarkerStyle) {
  const size = style.isSelected ? 48 : 40;
  const borderSize = style.isSelected ? 4 : 3;

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.border = `${borderSize}px solid #ffffff`;
  el.style.boxShadow = style.isSelected
    ? `0 0 0 3px ${style.color}, 0 4px 12px rgba(0,0,0,0.3)`
    : `0 2px 8px rgba(0,0,0,0.3)`;
  el.style.cursor = 'pointer';
  el.style.transition = 'all 0.2s ease';
  el.style.position = 'relative';
  el.style.zIndex = style.isUrgent ? '10' : style.isSelected ? '5' : '1';

  if (style.avatar_url) {
    el.style.backgroundImage = `url(${style.avatar_url})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundColor = style.color;
  } else {
    el.style.backgroundImage = 'none';
    el.style.background = `linear-gradient(135deg, ${style.color}, ${adjustColor(style.color, -30)})`;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#ffffff';
    el.style.fontWeight = '700';
    el.style.fontSize = `${Math.round(size * 0.32)}px`;
    el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    el.textContent = style.initials;
  }

  // Pulsing animation for urgent/live
  if (style.isUrgent) {
    el.style.animation = 'marker-pulse 1.5s ease-in-out infinite';
  } else if (style.status === 'live') {
    el.style.animation = 'marker-glow 2s ease-in-out infinite';
  } else {
    el.style.animation = 'none';
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
