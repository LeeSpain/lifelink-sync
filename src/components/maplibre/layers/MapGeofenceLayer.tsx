import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapInstance } from '../MapLibreMap';
import { GeofenceEntity } from '@/types/map';

interface MapGeofenceLayerProps {
  geofences: GeofenceEntity[];
  onGeofenceClick?: (geofence: GeofenceEntity) => void;
}

const SOURCE_ID = 'geofences-source';
const FILL_LAYER_ID = 'geofences-fill';
const OUTLINE_LAYER_ID = 'geofences-outline';
const LABEL_LAYER_ID = 'geofences-label';

// Generate a GeoJSON circle polygon from center + radius
function createCirclePolygon(lng: number, lat: number, radiusMeters: number, points = 64): GeoJSON.Feature {
  const coords: [number, number][] = [];
  const earthRadius = 6371000; // meters

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusMeters / earthRadius) * Math.cos(angle);
    const dLng = (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}

export function MapGeofenceLayer({ geofences, onGeofenceClick }: MapGeofenceLayerProps) {
  const map = useMapInstance();
  const addedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: geofences.map(g => {
        const circle = createCirclePolygon(g.lng, g.lat, g.radius_m);
        return {
          ...circle,
          properties: {
            id: g.id,
            name: g.name,
            radius_m: g.radius_m,
          },
        };
      }),
    };

    // Also create center points for labels
    const labelGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: geofences.map(g => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
        properties: { id: g.id, name: g.name, radius_m: g.radius_m },
      })),
    };

    if (!addedRef.current) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });
      map.addSource(`${SOURCE_ID}-labels`, { type: 'geojson', data: labelGeoJson });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.12,
        },
      });

      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.7,
        },
      });

      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: `${SOURCE_ID}-labels`,
        layout: {
          'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['get', 'radius_m']], 'm'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#1e40af',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      if (onGeofenceClick) {
        map.on('click', FILL_LAYER_ID, (e) => {
          const feature = e.features?.[0];
          if (feature) {
            const g = geofences.find(gf => gf.id === feature.properties?.id);
            if (g) onGeofenceClick(g);
          }
        });
        map.on('mouseenter', FILL_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', FILL_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });
      }

      addedRef.current = true;
    } else {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) source.setData(geojson);
      const labelSource = map.getSource(`${SOURCE_ID}-labels`) as maplibregl.GeoJSONSource;
      if (labelSource) labelSource.setData(labelGeoJson);
    }
  }, [map, geofences]);

  useEffect(() => {
    return () => {
      if (!map || !addedRef.current) return;
      try {
        [LABEL_LAYER_ID, OUTLINE_LAYER_ID, FILL_LAYER_ID].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource(`${SOURCE_ID}-labels`)) map.removeSource(`${SOURCE_ID}-labels`);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch { /* map destroyed */ }
      addedRef.current = false;
    };
  }, [map]);

  return null;
}
