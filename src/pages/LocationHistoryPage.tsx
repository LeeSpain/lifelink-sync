import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";

interface LocationPoint {
  id: string;
  lat: number;
  lng: number;
  captured_at: string;
  accuracy?: number;
  speed?: number;
  battery?: number;
}

interface PlaceEvent {
  id: string;
  event: 'enter' | 'exit';
  occurred_at: string;
  place: {
    name: string;
  };
}

export default function LocationHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(() => 
    new Date().toISOString().slice(0, 10)
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [placeEvents, setPlaceEvents] = useState<PlaceEvent[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Array<{ user_id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const loadFamilyMembers = async () => {
    if (!user) return;

    try {
      // Get user's family groups
      const { data: memberships, error } = await supabase
        .from("family_memberships")
        .select(`
          group_id,
          user_id
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      const groupIds = memberships?.map(m => m.group_id) || [];
      if (groupIds.length === 0) return;

      // Get all members of these groups
      const { data: allMembers, error: membersError } = await supabase
        .from("family_memberships")
        .select("user_id")
        .in("group_id", groupIds)
        .eq("status", "active");

      if (membersError) throw membersError;

      const memberIds = [...new Set(allMembers?.map(m => m.user_id) || [])];
      
      // Get member profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", memberIds);

      if (profilesError) throw profilesError;

      const members = profiles?.map(p => ({
        user_id: p.user_id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user_id.slice(0, 8)
      })) || [];

      setFamilyMembers(members);
      
      // Auto-select current user
      if (members.some(m => m.user_id === user.id)) {
        setSelectedUserId(user.id);
      } else if (members.length > 0) {
        setSelectedUserId(members[0].user_id);
      }
    } catch (error) {
      console.error("Error loading family members:", error);
    }
  };

  const loadLocationHistory = async () => {
    if (!selectedUserId || !selectedDate) return;

    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 1);

      // Load location points for the selected date
      const { data: locationData, error: locationError } = await supabase
        .from("location_pings")
        .select("*")
        .eq("user_id", selectedUserId)
        .gte("captured_at", startDate.toISOString())
        .lt("captured_at", endDate.toISOString())
        .order("captured_at", { ascending: true });

      if (locationError) throw locationError;

      setPoints(locationData || []);

      // Load place events for the selected date
      const { data: eventsData, error: eventsError } = await supabase
        .from("place_events")
        .select(`
          *,
          places!inner(name)
        `)
        .eq("user_id", selectedUserId)
        .gte("occurred_at", startDate.toISOString())
        .lt("occurred_at", endDate.toISOString())
        .order("occurred_at", { ascending: true });

      if (eventsError) throw eventsError;

      const events = eventsData?.map(e => ({
        id: e.id,
        event: e.event as 'enter' | 'exit',
        occurred_at: e.occurred_at,
        place: { name: e.places?.name || "Unknown Place" }
      })) || [];

      setPlaceEvents(events);

    } catch (error) {
      console.error("Error loading location history:", error);
      toast({
        title: "Error",
        description: "Failed to load location history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, [user]);

  useEffect(() => {
    if (selectedUserId && selectedDate) {
      loadLocationHistory();
    }
  }, [selectedUserId, selectedDate]);

  const formatTime = (timestamp: string) => {
    return format(parseISO(timestamp), 'HH:mm:ss');
  };

  const selectedMember = familyMembers.find(m => m.user_id === selectedUserId);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Location History</h1>
          <p className="text-muted-foreground">
            View location tracking history for family members (last 30 days)
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date & Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
              />
            </div>
            
            <div>
              <Label htmlFor="member">Family Member</Label>
              <select
                id="member"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select a member</option>
                {familyMembers.map(member => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {selectedMember && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{points.length}</div>
              <div className="text-sm text-muted-foreground">Location Points</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{placeEvents.length}</div>
              <div className="text-sm text-muted-foreground">Place Events</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {points.length > 0 ? `${Math.round((points[points.length - 1]?.captured_at ? 
                  (new Date(points[points.length - 1].captured_at).getTime() - new Date(points[0].captured_at).getTime()) / (1000 * 60 * 60) : 0))}h` : '0h'}
              </div>
              <div className="text-sm text-muted-foreground">Time Span</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {points.filter(p => p.battery !== null).length > 0 ? 
                  `${Math.round(points.filter(p => p.battery !== null).reduce((sum, p) => sum + (p.battery || 0), 0) / points.filter(p => p.battery !== null).length)}%` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Avg Battery</div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading location history...</p>
          </CardContent>
        </Card>
      ) : selectedMember ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Route Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Route visualization will appear here</p>
                  <p className="text-sm">({points.length} location points to display)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline for {selectedMember.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Combine and sort events and location points */}
                {[
                  ...placeEvents.map(event => ({
                    type: 'place_event' as const,
                    timestamp: event.occurred_at,
                    data: event
                  })),
                  ...points.slice(0, 20).map(point => ({
                    type: 'location' as const,
                    timestamp: point.captured_at,
                    data: point
                  }))
                ]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 50)
                  .map((item, index) => (
                    <div key={`${item.type}-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {item.type === 'place_event' ? (
                        <>
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            item.data.event === 'enter' ? 'bg-emerald-500' : 'bg-orange-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.data.event === 'enter' ? 
                                <ArrowRight className="w-4 h-4 text-emerald-500" /> : 
                                <ArrowLeft className="w-4 h-4 text-orange-500" />
                              }
                              <span className="font-medium">
                                {item.data.event === 'enter' ? 'Arrived at' : 'Left'} {item.data.place.name}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(item.data.occurred_at)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">Location Update</span>
                              {item.data.battery && (
                                <Badge variant="outline" className="text-xs">
                                  {item.data.battery}%
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(item.data.captured_at)} • {item.data.lat.toFixed(6)}, {item.data.lng.toFixed(6)}
                              {item.data.accuracy && ` • ±${Math.round(item.data.accuracy)}m`}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                {points.length === 0 && placeEvents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="w-12 h-12 mx-auto mb-2" />
                    <p>No location data available for this date</p>
                    <p className="text-sm">Location tracking may not have been active</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Date and Member</h3>
            <p className="text-muted-foreground">
              Choose a date and family member to view their location history
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}