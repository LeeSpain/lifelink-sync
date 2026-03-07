import { useRef, useCallback, useState } from 'react';
import type { MapLibreMapRef } from '@/components/maplibre/MapLibreMap';
import type { MapEntity, MapFilterState, MapSummary, MapMode } from '@/types/map';
import { getStatusFromPresence, getUrgencyFromStatus } from '@/types/map';

const DEFAULT_FILTERS: MapFilterState = {
  mode: 'overview',
  showOffline: true,
  showPaused: true,
  searchQuery: '',
  selectedEntityId: null,
  statusFilters: ['live', 'idle', 'offline', 'paused'],
};

export function useMapLibre() {
  const mapRef = useRef<MapLibreMapRef>(null);
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_FILTERS);

  const flyTo = useCallback((center: { lat: number; lng: number }, zoom?: number) => {
    mapRef.current?.flyTo(center, zoom);
  }, []);

  const fitBounds = useCallback((bounds: [[number, number], [number, number]]) => {
    mapRef.current?.fitBounds(bounds);
  }, []);

  const setMode = useCallback((mode: MapMode) => {
    setFilters(prev => ({ ...prev, mode }));
  }, []);

  const setSelectedEntity = useCallback((id: string | null) => {
    setFilters(prev => ({ ...prev, selectedEntityId: id }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleStatusFilter = useCallback((status: MapFilterState['statusFilters'][number]) => {
    setFilters(prev => {
      const current = prev.statusFilters;
      const next = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, statusFilters: next };
    });
  }, []);

  const filterEntities = useCallback((entities: MapEntity[]): MapEntity[] => {
    return entities.filter(entity => {
      if (entity.type !== 'member') return true;
      const status = entity.status || getStatusFromPresence(entity.last_seen, entity.is_paused);
      if (!filters.statusFilters.includes(status)) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const label = (entity.label || entity.first_name || entity.id).toLowerCase();
        if (!label.includes(q)) return false;
      }
      return true;
    });
  }, [filters.statusFilters, filters.searchQuery]);

  const computeSummary = useCallback((entities: MapEntity[]): MapSummary => {
    const members = entities.filter(e => e.type === 'member');
    const incidents = entities.filter(e => e.type === 'incident');
    const filtered = filterEntities(entities);
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => {
        const s = m.status || getStatusFromPresence(m.last_seen, m.is_paused);
        return s === 'live';
      }).length,
      offlineMembers: members.filter(m => {
        const s = m.status || getStatusFromPresence(m.last_seen, m.is_paused);
        return s === 'offline';
      }).length,
      pausedMembers: members.filter(m => {
        const s = m.status || getStatusFromPresence(m.last_seen, m.is_paused);
        return s === 'paused';
      }).length,
      activeIncidents: incidents.filter(i => i.metadata?.status === 'active').length,
      filteredCount: filtered.length,
    };
  }, [filterEntities]);

  return {
    mapRef,
    filters,
    setFilters,
    flyTo,
    fitBounds,
    setMode,
    setSelectedEntity,
    setSearchQuery,
    toggleStatusFilter,
    filterEntities,
    computeSummary,
  };
}
