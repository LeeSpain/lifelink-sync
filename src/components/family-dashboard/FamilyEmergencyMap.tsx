import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useToast } from '@/hooks/use-toast';

const FamilyEmergencyMap = () => {
  const navigate = useNavigate();
  const { data: familyRole } = useFamilyRole();
  const { toast } = useToast();
  
  const [activeSOSEvents, setActiveSOSEvents] = useState<any[]>([]);
  const [sosLocations, setSOSLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (familyRole?.familyGroupId) {
      loadEmergencyData();
      
      // Set up real-time location updates
      const locationChannel = supabase
        .channel('family-emergency-locations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sos_locations'
          },
          () => loadEmergencyData()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sos_events',
            filter: `group_id=eq.${familyRole.familyGroupId}`
          },
          () => loadEmergencyData()
        )
        .subscribe();

      // Auto-refresh every 30 seconds for live locations
      const interval = setInterval(() => {
        if (!refreshing) {
          loadEmergencyData();
        }
      }, 30000);

      return () => {
        supabase.removeChannel(locationChannel);
        clearInterval(interval);
      };
    } else if (familyRole && (familyRole.role === 'none' || !familyRole.familyGroupId)) {
      // No family access - stop loading
      setIsLoading(false);
    }
  }, [familyRole?.familyGroupId, familyRole?.role]);

  const loadEmergencyData = async () => {
    if (!familyRole?.familyGroupId) return;

    try {
      // Load active SOS events
      const { data: sosEvents } = await supabase
        .from('sos_events')
        .select('*')
        .eq('group_id', familyRole.familyGroupId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setActiveSOSEvents(sosEvents || []);

      // Load SOS locations for active events
      if (sosEvents && sosEvents.length > 0) {
        const eventIds = sosEvents.map(event => event.id);
        const { data: locations } = await supabase
          .from('sos_locations')
          .select('*')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false });

        setSOSLocations(locations || []);
      } else {
        setSOSLocations([]);
      }

    } catch (error) {
      console.error('Error loading emergency data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmergencyData();
    setRefreshing(false);
    toast({
      title: "Map Updated",
      description: "Emergency locations have been refreshed"
    });
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show no access state if user has no family role
  if (familyRole && (familyRole.role === 'none' || !familyRole.familyGroupId)) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Emergency Access</h3>
            <p className="text-muted-foreground mb-4">
              You need family access to view emergency locations and live tracking.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/member-dashboard')}
            >
              Return to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emergency Map</h1>
          <p className="text-muted-foreground">
            Live family emergency locations and status
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active Emergencies */}
      {activeSOSEvents.length > 0 ? (
        <div className="space-y-4">
          {activeSOSEvents.map((event) => {
            const eventLocations = sosLocations.filter(loc => loc.event_id === event.id);
            const latestLocation = eventLocations[0];

            return (
              <Card key={event.id} className="border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Active Emergency SOS
                    </CardTitle>
                    <Badge variant="destructive">LIVE</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Emergency Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Started: {new Date(event.created_at).toLocaleString()}</span>
                          </div>
                          {event.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{event.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Family notified</span>
                          </div>
                        </div>
                      </div>
                      
                      {latestLocation && (
                        <div>
                          <h4 className="font-semibold mb-2">Latest Location</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Navigation className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {latestLocation.latitude.toFixed(6)}, {latestLocation.longitude.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Updated: {getTimeAgo(latestLocation.created_at)}</span>
                            </div>
                            {latestLocation.accuracy && (
                              <div className="text-xs text-muted-foreground">
                                Accuracy: ±{latestLocation.accuracy}m
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-red-200">
                      {latestLocation && (
                        <Button 
                          size="sm"
                          onClick={() => handleGetDirections(latestLocation.latitude, latestLocation.longitude)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Get Directions
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`tel:112`, '_self')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call 112
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRefresh}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Location
                      </Button>
                    </div>
                  </div>

                  {/* Location History */}
                  {eventLocations.length > 1 && (
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <h4 className="font-semibold mb-3">Location History</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {eventLocations.slice(1, 6).map((location, index) => (
                          <div key={location.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {getTimeAgo(location.created_at)}
                            </span>
                            <span className="font-mono text-xs">
                              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* No Active Emergencies */
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Active Emergencies</h3>
            <p className="text-muted-foreground mb-4">
              All family members are safe. Emergency locations will appear here when SOS is activated.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-green-500" />
                GPS Ready
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                SOS Monitoring
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                Live Updates
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            How Emergency Map Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">Live Location Sharing</p>
              <p>Family members share live locations continuously for safety monitoring. Emergency contacts receive exact location only when SOS is activated.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">Live Updates</p>
              <p>Emergency locations update automatically every 30 seconds during active incidents.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-foreground">Quick Response</p>
              <p>Get directions to family members and coordinate emergency response efforts.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyEmergencyMap;