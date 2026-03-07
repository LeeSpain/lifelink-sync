import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MessageSquare
} from 'lucide-react';

interface SOSEvent {
  id: string;
  user_id: string;
  status: 'active' | 'in-progress' | 'resolved' | 'canceled';
  trigger_location: any;
  address: string;
  created_at: string;
  resolved_at?: string;
  metadata: any;
  group_id?: string;
}

interface EventDetails extends SOSEvent {
  profile?: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  family_alerts?: any[];
  sos_acknowledgements?: any[];
  sos_locations?: any[];
}

const EmergencyIncidentsPage = () => {
  const [events, setEvents] = useState<SOSEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    setupRealTimeSubscription();
  }, [filter]);

  const setupRealTimeSubscription = () => {
    const channel = supabase
      .channel('admin-sos-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_events' },
        (payload) => {
          console.log('SOS event change:', payload);
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('sos_events')
        .select(`
          *,
          profiles!sos_events_user_id_fkey (
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Type-safe data mapping
      const typedEvents: SOSEvent[] = (data || []).map(event => ({
        ...event,
        status: event.status as 'active' | 'in-progress' | 'resolved' | 'canceled'
      }));
      
      setEvents(typedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEventDetails = async (eventId: string) => {
    try {
      const { data: event, error } = await supabase
        .from('sos_events')
        .select(`
          *,
          profiles!sos_events_user_id_fkey (
            first_name,
            last_name,
            phone,
            email
          ),
          family_alerts (*),
          sos_acknowledgements (*),
          sos_locations (*)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      // Type-safe event details mapping
      const typedEvent: EventDetails = {
        ...event,
        status: event.status as 'active' | 'in-progress' | 'resolved' | 'canceled',
        profile: event.profiles as any
      };
      
      setSelectedEvent(typedEvent);
    } catch (error) {
      console.error('Error loading event details:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive"
      });
    }
  };

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sos_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Event marked as ${newStatus}`,
      });

      loadEvents();
      if (selectedEvent?.id === eventId) {
        loadEventDetails(eventId);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive"
      });
    }
  };

  const addAdminNote = async (eventId: string) => {
    if (!adminNotes.trim()) return;

    try {
      const { data: event } = await supabase
        .from('sos_events')
        .select('metadata')
        .eq('id', eventId)
        .single();

      const existingMetadata = (event?.metadata as any) || {};
      const adminNotesArray = existingMetadata.admin_notes || [];
      
      const newNote = {
        note: adminNotes,
        timestamp: new Date().toISOString(),
        admin_user: 'Admin'
      };

      adminNotesArray.push(newNote);

      const { error } = await supabase
        .from('sos_events')
        .update({
          metadata: {
            ...existingMetadata,
            admin_notes: adminNotesArray
          }
        })
        .eq('id', eventId);

      if (error) throw error;

      setAdminNotes('');
      toast({
        title: "Note Added",
        description: "Admin note has been saved"
      });

      loadEventDetails(eventId);
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add admin note",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'in-progress': return 'default';
      case 'resolved': return 'secondary';
      case 'canceled': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event as any).profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event as any).profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const activeEventsCount = events.filter(e => e.status === 'active').length;
  const inProgressCount = events.filter(e => e.status === 'in-progress').length;
  const resolvedTodayCount = events.filter(e => 
    e.status === 'resolved' && 
    new Date(e.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emergency Incidents</h1>
          <p className="text-muted-foreground">Real-time emergency event monitoring and management</p>
        </div>
        <Button 
          onClick={() => {
            setRefreshing(true);
            loadEvents().then(() => setRefreshing(false));
          }}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alert Banner for Active Emergencies */}
      {activeEventsCount > 0 && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-destructive">
            <strong>{activeEventsCount} ACTIVE EMERGENCY{activeEventsCount > 1 ? 'IES' : ''}</strong> requiring immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-destructive">{activeEventsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-orange-500">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-green-500">{resolvedTodayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-primary">{events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No emergency events found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusBadgeVariant(event.status)} className="flex items-center gap-1">
                          {getStatusIcon(event.status)}
                          {event.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-lg">
                        {(event as any).profiles?.first_name} {(event as any).profiles?.last_name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.address || 'Location unavailable'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {event.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => updateEventStatus(event.id, 'in-progress')}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Take Action
                        </Button>
                      )}
                      
                      {event.status === 'in-progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateEventStatus(event.id, 'resolved')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Mark Resolved
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadEventDetails(event.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Emergency Event Details</DialogTitle>
                          </DialogHeader>
                          
                          {selectedEvent && (
                            <div className="space-y-6">
                              <Tabs defaultValue="overview">
                                <TabsList>
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="location">Location</TabsTrigger>
                                  <TabsTrigger value="responses">Family Responses</TabsTrigger>
                                  <TabsTrigger value="notes">Admin Notes</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">User</label>
                                      <p>{selectedEvent.profile?.first_name} {selectedEvent.profile?.last_name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Phone</label>
                                      <p>{selectedEvent.profile?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge variant={getStatusBadgeVariant(selectedEvent.status)}>
                                        {selectedEvent.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Triggered At</label>
                                      <p>{new Date(selectedEvent.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {selectedEvent.profile?.phone && (
                                      <Button 
                                        onClick={() => window.open(`tel:${selectedEvent.profile?.phone}`, '_self')}
                                        className="bg-blue-500 hover:bg-blue-600"
                                      >
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call User
                                      </Button>
                                    )}
                                    <Button 
                                      onClick={() => window.open('tel:112', '_self')}
                                      variant="destructive"
                                    >
                                      <Phone className="h-4 w-4 mr-2" />
                                      Call Emergency Services
                                    </Button>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="location">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Address</label>
                                      <p>{selectedEvent.address || 'No address available'}</p>
                                    </div>
                                    {selectedEvent.sos_locations && selectedEvent.sos_locations.length > 0 && (
                                      <div>
                                        <label className="text-sm font-medium">Location Updates</label>
                                        <div className="space-y-2 mt-2">
                                          {selectedEvent.sos_locations.map((loc: any) => (
                                            <div key={loc.id} className="p-2 border rounded text-sm">
                                              <p>Lat: {loc.lat}, Lng: {loc.lng}</p>
                                              <p className="text-muted-foreground">
                                                {new Date(loc.created_at).toLocaleString()}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="responses">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Family Acknowledgements</label>
                                      {selectedEvent.sos_acknowledgements && selectedEvent.sos_acknowledgements.length > 0 ? (
                                        <div className="space-y-2 mt-2">
                                          {selectedEvent.sos_acknowledgements.map((ack: any) => (
                                            <div key={ack.id} className="p-2 border rounded">
                                              <p className="text-sm">Family member responded</p>
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(ack.acknowledged_at).toLocaleString()}
                                              </p>
                                              {ack.message && (
                                                <p className="text-sm mt-1">"{ack.message}"</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground mt-2">No family responses yet</p>
                                      )}
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="notes">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Add Admin Note</label>
                                      <div className="flex gap-2 mt-2">
                                        <Textarea
                                          placeholder="Add a note about this incident..."
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                        />
                                        <Button onClick={() => addAdminNote(selectedEvent.id)}>
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Add Note
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {selectedEvent.metadata?.admin_notes && (
                                      <div>
                                        <label className="text-sm font-medium">Previous Notes</label>
                                        <div className="space-y-2 mt-2">
                                          {selectedEvent.metadata.admin_notes.map((note: any, index: number) => (
                                            <div key={index} className="p-3 border rounded">
                                              <p className="text-sm">{note.note}</p>
                                              <p className="text-xs text-muted-foreground mt-1">
                                                {note.admin_user} - {new Date(note.timestamp).toLocaleString()}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyIncidentsPage;