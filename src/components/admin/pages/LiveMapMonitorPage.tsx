import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCanvasMap } from '@/hooks/useCanvasMap';
import { Map, Users, MapPin, Activity, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LivePresence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen: string;
  battery?: number;
  is_paused: boolean;
}

interface FamilyGroup {
  id: string;
  owner_user_id: string;
  member_count: number;
}

export default function LiveMapMonitorPage() {
  const [presences, setPresences] = useState<LivePresence[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [locationPings, setLocationPings] = useState<any[]>([]);
  const [placeEvents, setPlaceEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { MapView } = useCanvasMap();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const createSampleData = async () => {
    try {
      setLoading(true);
      toast({
        title: "Creating Sample Data",
        description: "Generating test family groups and location data..."
      });

      // Create sample live presence data for demo
      const samplePresences = [
        {
          user_id: '11111111-1111-1111-1111-111111111111',
          lat: 37.3881024, // Albox, Spain (from geo logs)
          lng: -2.1417503,
          last_seen: new Date().toISOString(),
          battery: 85,
          is_paused: false,
          updated_at: new Date().toISOString()
        },
        {
          user_id: '22222222-2222-2222-2222-222222222222',
          lat: 37.3901024,
          lng: -2.1437503,
          last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          battery: 72,
          is_paused: false,
          updated_at: new Date().toISOString()
        },
        {
          user_id: '33333333-3333-3333-3333-333333333333',
          lat: 37.3861024,
          lng: -2.1397503,
          last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          battery: 45,
          is_paused: true,
          updated_at: new Date().toISOString()
        }
      ];

      // Insert sample presence data
      for (const presence of samplePresences) {
        await supabase
          .from('live_presence')
          .upsert(presence, { onConflict: 'user_id' });
      }

      toast({
        title: "Success",
        description: "Sample data created successfully!"
      });

      // Reload data to show the new sample data
      await loadData();
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive"
      });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all live presence data
      const { data: presenceData, error: presenceError } = await supabase
        .from('live_presence')
        .select('*');

      if (presenceError) {
        console.error('Presence error:', presenceError);
      }

      // Load family groups with member counts
      const { data: groupsData, error: groupsError } = await supabase
        .from('family_groups')
        .select('*');

      if (groupsError) {
        console.error('Groups error:', groupsError);
      }

      // Load location pings for additional analytics
      const { data: locationData, error: locationError } = await supabase
        .from('location_pings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (locationError) {
        console.error('Location error:', locationError);
      }

      // Load place events
      const { data: eventsData, error: eventsError } = await supabase
        .from('place_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Events error:', eventsError);
      }

      // Transform groups data to include member count
      const enrichedGroups = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('family_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return {
            ...group,
            member_count: count || 0
          };
        })
      );

      setPresences(presenceData || []);
      setFamilyGroups(enrichedGroups);
      setLocationPings(locationData || []);
      setPlaceEvents(eventsData || []);

    } catch (error) {
      console.error('Error loading Live Map data:', error);
      toast({
        title: "Error",
        description: "Failed to load Live Map data. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const activePresences = presences.filter(p => !p.is_paused);
  const pausedPresences = presences.filter(p => p.is_paused);

  const markers = activePresences.map(presence => ({
    id: presence.user_id,
    lat: presence.lat,
    lng: presence.lng,
    render: () => (
      <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg" />
    )
  }));

  const mapCenter = useMemo(() => {
    if (activePresences.length === 0) return { lat: 37.7749, lng: -122.4194 };
    const sums = activePresences.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
    return { lat: sums.lat / activePresences.length, lng: sums.lng / activePresences.length };
  }, [activePresences]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Map Monitor</h1>
          <p className="text-muted-foreground">Real-time family location tracking overview</p>
        </div>
        <div className="flex gap-2">
          {presences.length === 0 && (
            <Button onClick={createSampleData} disabled={loading} variant="default">
              Create Sample Data
            </Button>
          )}
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Status Alert */}
      {presences.length === 0 && !loading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">No Location Data Available</h3>
                <p className="text-sm text-yellow-700">
                  The Live Map system is ready but has no active users sharing location data. 
                  You can create sample data to test the system or wait for real users to start sharing their location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePresences.length}</div>
            <p className="text-xs text-muted-foreground">Currently sharing location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Users</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pausedPresences.length}</div>
            <p className="text-xs text-muted-foreground">Location sharing paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Family Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{familyGroups.length}</div>
            <p className="text-xs text-muted-foreground">Active family circles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location Pings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{locationPings.length}</div>
            <p className="text-xs text-muted-foreground">Recent location updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Place Events</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{placeEvents.length}</div>
            <p className="text-xs text-muted-foreground">Geofence enter/exit events</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Map View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Global Family Location Map
          </CardTitle>
          <CardDescription>
            Real-time view of all active family members' locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 rounded-lg overflow-hidden border">
            <MapView
              markers={markers}
              className="w-full h-full"
              center={mapCenter}
              showControls={true}
              interactive={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Presence Details */}
      <Card>
        <CardHeader>
          <CardTitle>Location Status Details</CardTitle>
          <CardDescription>Detailed view of all users in the Live Map system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {presences.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active location data found</p>
            ) : (
              presences.map((presence) => (
                <div key={presence.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${presence.is_paused ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="font-medium">User {presence.user_id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {presence.lat.toFixed(6)}, {presence.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {presence.battery && (
                      <Badge variant="outline">{presence.battery}% battery</Badge>
                    )}
                    <Badge variant={presence.is_paused ? "secondary" : "default"}>
                      {presence.is_paused ? 'Paused' : 'Active'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(presence.last_seen).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}