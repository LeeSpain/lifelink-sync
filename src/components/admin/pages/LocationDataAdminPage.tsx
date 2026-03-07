import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { History, MapPin, Database, Clock, RefreshCw, Download, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPing {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  battery?: number;
  captured_at: string;
  source: string;
  speed?: number;
}

interface LocationStats {
  totalPings: number;
  uniqueUsers: number;
  avgAccuracy: number;
  lastUpdate: string;
  dailyPings: number;
  weeklyPings: number;
}

export default function LocationDataAdminPage() {
  const [locationPings, setLocationPings] = useState<LocationPing[]>([]);
  const [stats, setStats] = useState<LocationStats>({
    totalPings: 0,
    uniqueUsers: 0,
    avgAccuracy: 0,
    lastUpdate: '',
    dailyPings: 0,
    weeklyPings: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [selectedPing, setSelectedPing] = useState<LocationPing | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLocationData();
  }, [selectedUser, timeRange]);

  const createSampleLocationData = async () => {
    try {
      setLoading(true);
      toast({
        title: "Creating Sample Location Data",
        description: "Generating location ping history..."
      });

      const now = new Date();
      const samplePings = [];

      // Create location history for the past 7 days
      for (let i = 0; i < 50; i++) {
        const hoursAgo = Math.random() * 168; // Random time in past week
        const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        
        // Simulate movement around Albox, Spain
        const baseLatitude = 37.3881024;
        const baseLongitude = -2.1417503;
        const variation = 0.01; // About 1km variation
        
        samplePings.push({
          user_id: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'][Math.floor(Math.random() * 3)],
          lat: baseLatitude + (Math.random() - 0.5) * variation,
          lng: baseLongitude + (Math.random() - 0.5) * variation,
          accuracy: Math.floor(Math.random() * 20) + 5, // 5-25m accuracy
          battery: Math.floor(Math.random() * 100),
          captured_at: timestamp.toISOString(),
          source: ['gps', 'network', 'manual'][Math.floor(Math.random() * 3)],
          speed: Math.random() * 60 // Random speed 0-60 km/h
        });
      }

      const { error } = await supabase
        .from('location_pings')
        .insert(samplePings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sample location data created successfully!"
      });

      await loadLocationData();
    } catch (error) {
      console.error('Error creating sample location data:', error);
      toast({
        title: "Error",
        description: "Failed to create sample location data",
        variant: "destructive"
      });
    }
  };

  const loadLocationData = async () => {
    try {
      setLoading(true);

      // Calculate time filter
      const now = new Date();
      let timeFilter = new Date();
      switch (timeRange) {
        case '1h':
          timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Build query
      let query = supabase
        .from('location_pings')
        .select('*')
        .gte('captured_at', timeFilter.toISOString())
        .order('captured_at', { ascending: false })
        .limit(200);

      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      const { data: pingsData, error: pingsError } = await query;

      if (pingsError) {
        console.error('Location pings error:', pingsError);
      }

      // Calculate statistics
      const pings = pingsData || [];
      const uniqueUsers = new Set(pings.map(p => p.user_id)).size;
      const avgAccuracy = pings.length > 0 ? 
        pings.reduce((sum, p) => sum + (p.accuracy || 0), 0) / pings.length : 0;
      
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const dailyPings = pings.filter(p => new Date(p.captured_at) > oneDayAgo).length;
      const weeklyPings = pings.filter(p => new Date(p.captured_at) > oneWeekAgo).length;

      setLocationPings(pings);
      setStats({
        totalPings: pings.length,
        uniqueUsers,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        lastUpdate: pings.length > 0 ? pings[0].captured_at : '',
        dailyPings,
        weeklyPings
      });

    } catch (error) {
      console.error('Error loading location data:', error);
      toast({
        title: "Error",
        description: "Failed to load location data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ['User ID', 'Latitude', 'Longitude', 'Accuracy', 'Battery', 'Source', 'Speed', 'Timestamp'],
      ...locationPings.map(ping => [
        ping.user_id,
        ping.lat.toString(),
        ping.lng.toString(),
        ping.accuracy?.toString() || '',
        ping.battery?.toString() || '',
        ping.source,
        ping.speed?.toString() || '',
        ping.captured_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDataRetention = async () => {
    if (!confirm('This will delete location data older than 90 days. Continue?')) return;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const { error } = await supabase
        .from('location_pings')
        .delete()
        .lt('captured_at', cutoffDate.toISOString());

      if (error) throw error;

      toast({
        title: "Success",
        description: "Old location data cleaned up successfully"
      });

      await loadLocationData();
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast({
        title: "Error",
        description: "Failed to clean up old data",
        variant: "destructive"
      });
    }
  };

  const uniqueUserIds = [...new Set(locationPings.map(p => p.user_id))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Location Data Management</h1>
          <p className="text-muted-foreground">Historical location data and privacy controls</p>
        </div>
        <div className="flex gap-2">
          {locationPings.length === 0 && (
            <Button onClick={createSampleLocationData} disabled={loading} variant="default">
              Create Sample Data
            </Button>
          )}
          <Button onClick={handleExportData} disabled={loading || locationPings.length === 0} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadLocationData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">User:</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUserIds.map(userId => (
                <SelectItem key={userId} value={userId}>
                  User {userId.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Time Range:</label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pings</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPings}</div>
            <p className="text-xs text-muted-foreground">In selected timeframe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Unique users tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgAccuracy}m</div>
            <p className="text-xs text-muted-foreground">Location precision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.dailyPings}</div>
            <p className="text-xs text-muted-foreground">Pings in last 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* No Data Alert */}
      {locationPings.length === 0 && !loading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">No Location Data Found</h3>
                <p className="text-sm text-yellow-700">
                  No location ping data is available for the selected filters. Create sample data to see how location tracking works.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Data Table */}
      {locationPings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Location Ping History</CardTitle>
                <CardDescription>Recent location updates from family members</CardDescription>
              </div>
              <Button onClick={handleDataRetention} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Old Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {locationPings.map((ping) => (
                <div key={ping.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">User {ping.user_id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {ping.lat.toFixed(6)}, {ping.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ping.captured_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {ping.accuracy && (
                      <Badge variant="outline">±{ping.accuracy}m</Badge>
                    )}
                    {ping.battery && (
                      <Badge variant="outline">{ping.battery}%</Badge>
                    )}
                    <Badge variant="secondary">{ping.source}</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedPing(ping)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ping Details Dialog */}
      <Dialog open={!!selectedPing} onOpenChange={() => setSelectedPing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Location Ping Details</DialogTitle>
            <DialogDescription>
              Detailed information about this location update
            </DialogDescription>
          </DialogHeader>
          
          {selectedPing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Latitude</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.lat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Longitude</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.lng}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Accuracy</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.accuracy || 'N/A'}m</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Battery Level</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.battery || 'N/A'}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Speed</label>
                  <p className="text-sm text-muted-foreground">{selectedPing.speed ? `${selectedPing.speed} km/h` : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedPing.captured_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${selectedPing.lat},${selectedPing.lng}`;
                    window.open(url, '_blank');
                  }}
                  variant="outline"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}