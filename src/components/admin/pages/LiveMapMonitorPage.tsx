import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, Users, MapPin, Activity, RefreshCw, AlertTriangle, Eye, Shield, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MapLibreMap, { MapLibreMapRef } from '@/components/maplibre/MapLibreMap';
import { MapMemberLayer } from '@/components/maplibre/layers/MapMemberLayer';
import { MapShell } from '@/components/maplibre/MapShell';
import { MapSummaryBar } from '@/components/maplibre/MapSummaryBar';
import { MapModeSwitcher } from '@/components/maplibre/MapModeSwitcher';
import { MapFiltersPanel } from '@/components/maplibre/MapFiltersPanel';
import { MapDetailsDrawer } from '@/components/maplibre/MapDetailsDrawer';
import { MapLiveEventFeed } from '@/components/maplibre/MapLiveEventFeed';
import { MapLegend } from '@/components/maplibre/MapLegend';
import { MapSearchControl } from '@/components/maplibre/MapSearchControl';
import { useMapLibre } from '@/hooks/useMapLibre';
import { MapEntity, MapSummary, getStatusFromPresence } from '@/types/map';

interface LivePresence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen: string;
  battery?: number;
  is_paused: boolean;
}

export default function LiveMapMonitorPage() {
  const [presences, setPresences] = useState<LivePresence[]>([]);
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);
  const [locationPings, setLocationPings] = useState<any[]>([]);
  const [placeEvents, setPlaceEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const mapRef = useRef<MapLibreMapRef>(null);
  const { filters, setMode, setSelectedEntity, setSearchQuery, toggleStatusFilter, filterEntities, computeSummary } = useMapLibre();
  const [selectedEntity, setSelectedEntityLocal] = useState<MapEntity | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const createSampleData = async () => {
    try {
      setLoading(true);
      toast({ title: "Creating Sample Data", description: "Generating test family groups and location data..." });
      const samplePresences = [
        { user_id: '11111111-1111-1111-1111-111111111111', lat: 37.3881024, lng: -2.1417503, last_seen: new Date().toISOString(), battery: 85, is_paused: false, updated_at: new Date().toISOString() },
        { user_id: '22222222-2222-2222-2222-222222222222', lat: 37.3901024, lng: -2.1437503, last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), battery: 72, is_paused: false, updated_at: new Date().toISOString() },
        { user_id: '33333333-3333-3333-3333-333333333333', lat: 37.3861024, lng: -2.1397503, last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), battery: 45, is_paused: true, updated_at: new Date().toISOString() },
      ];
      for (const presence of samplePresences) {
        await supabase.from('live_presence').upsert(presence, { onConflict: 'user_id' });
      }
      toast({ title: "Success", description: "Sample data created successfully!" });
      await loadData();
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast({ title: "Error", description: "Failed to create sample data", variant: "destructive" });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [presenceResult, groupsResult, locationResult, eventsResult] = await Promise.all([
        supabase.from('live_presence').select('*'),
        supabase.from('family_groups').select('*'),
        supabase.from('location_pings').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('place_events').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const enrichedGroups = await Promise.all(
        (groupsResult.data || []).map(async (group) => {
          const { count } = await supabase.from('family_memberships').select('*', { count: 'exact', head: true }).eq('group_id', group.id);
          return { ...group, member_count: count || 0 };
        })
      );

      setPresences(presenceResult.data || []);
      setFamilyGroups(enrichedGroups);
      setLocationPings(locationResult.data || []);
      setPlaceEvents(eventsResult.data || []);
    } catch (error) {
      console.error('Error loading Live Map data:', error);
      toast({ title: "Error", description: "Failed to load Live Map data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Convert presences to map entities
  const allEntities: MapEntity[] = useMemo(() =>
    presences.map(p => ({
      id: p.user_id,
      type: 'member' as const,
      lat: p.lat,
      lng: p.lng,
      label: `User ${p.user_id.slice(0, 8)}`,
      status: getStatusFromPresence(p.last_seen, p.is_paused),
      battery: p.battery,
      last_seen: p.last_seen,
      is_paused: p.is_paused,
    })),
  [presences]);

  const filteredEntities = useMemo(() => filterEntities(allEntities), [allEntities, filterEntities]);
  const summary: MapSummary = useMemo(() => computeSummary(allEntities), [allEntities, computeSummary]);

  const mapCenter = useMemo(() => {
    const active = presences.filter(p => !p.is_paused);
    if (active.length === 0) return { lat: 37.7749, lng: -122.4194 };
    const sums = active.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
    return { lat: sums.lat / active.length, lng: sums.lng / active.length };
  }, [presences]);

  const handleMemberClick = useCallback((entity: MapEntity) => {
    setSelectedEntityLocal(entity);
    setSelectedEntity(entity.id);
  }, []);

  const handleSearchLocation = useCallback((lat: number, lng: number, _name: string) => {
    mapRef.current?.flyTo({ lat, lng }, 16);
  }, []);

  // Convert place events to feed format
  const feedEvents = useMemo(() =>
    placeEvents.slice(0, 10).map(e => ({
      id: e.id,
      type: (e.event || 'update') as 'enter' | 'exit' | 'sos' | 'update',
      user_id: e.user_id,
      place_name: e.place_name,
      timestamp: e.created_at || e.occurred_at,
    })),
  [placeEvents]);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Map Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time command centre</p>
        </div>
        <div className="flex gap-2">
          {presences.length === 0 && (
            <Button onClick={createSampleData} disabled={loading} variant="default">Create Sample Data</Button>
          )}
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      {presences.length === 0 && !loading && (
        <div className="px-4 py-3">
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">No Location Data Available</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Create sample data to test the command centre.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Command Centre Layout */}
      <MapShell
        showLeftPanel={true}
        showRightPanel={!!selectedEntity}
        summaryBar={<MapSummaryBar summary={summary} />}
        leftPanel={
          <>
            <MapModeSwitcher mode={filters.mode} onChange={setMode} />
            <MapSearchControl onLocationSelect={handleSearchLocation} />
            <MapFiltersPanel filters={filters} onSearchChange={setSearchQuery} onToggleStatus={toggleStatusFilter} />
            <MapLiveEventFeed events={feedEvents} />
            <MapLegend />
          </>
        }
        rightPanel={
          selectedEntity ? (
            <MapDetailsDrawer entity={selectedEntity} onClose={() => { setSelectedEntityLocal(null); setSelectedEntity(null); }} />
          ) : undefined
        }
      >
        <MapLibreMap
          ref={mapRef}
          className="w-full h-full"
          center={mapCenter}
          zoom={14}
          interactive={true}
        >
          <MapMemberLayer
            members={filteredEntities}
            onMemberClick={handleMemberClick}
            selectedId={selectedEntity?.id}
            enableClustering={filteredEntities.length > 20}
          />
        </MapLibreMap>
      </MapShell>
    </div>
  );
}
