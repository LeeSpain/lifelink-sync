import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MapPin, Clock, AlertTriangle, User, MessageSquare } from "lucide-react";

interface SOSEvent {
  id: string;
  user_id: string;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  location_data?: any;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export const CallCentreHub = () => {
  const [activeSOSEvents, setActiveSOSEvents] = useState<SOSEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SOSEvent | null>(null);
  const [isOperatorView, setIsOperatorView] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveSOSEvents();
    
    // Set up real-time subscription for SOS events
    const channel = supabase
      .channel('sos_events_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sos_events' },
        () => {
          fetchActiveSOSEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveSOSEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('sos_events')
        .select(`
          id,
          user_id,
          status,
          created_at
        `)
        .in('status', ['open', 'acknowledged'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveSOSEvents(data || []);
    } catch (error) {
      console.error('Error fetching SOS events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active SOS events",
        variant: "destructive"
      });
    }
  };

  const updateSOSStatus = async (eventId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sos_events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `SOS event marked as ${newStatus}`,
      });

      fetchActiveSOSEvents();
    } catch (error) {
      console.error('Error updating SOS status:', error);
      toast({
        title: "Error",
        description: "Failed to update SOS status",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - eventTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ${diffInMinutes % 60}m ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Centre Operations</h1>
          <p className="text-muted-foreground">Manage emergency SOS events and coordinate responses</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={activeSOSEvents.length > 0 ? "destructive" : "secondary"}>
            {activeSOSEvents.length} Active SOS Events
          </Badge>
          <Button
            variant={isOperatorView ? "default" : "outline"}
            onClick={() => setIsOperatorView(!isOperatorView)}
          >
            {isOperatorView ? "Operator View" : "Supervisor View"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active-events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-events">Active Events</TabsTrigger>
          <TabsTrigger value="event-details">Event Details</TabsTrigger>
          <TabsTrigger value="response-tools">Response Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="active-events" className="space-y-4">
          {activeSOSEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Active SOS Events</h3>
                <p className="text-muted-foreground">All emergency situations are currently resolved</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeSOSEvents.map((event) => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedEvent(event)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`} />
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {event.profiles?.first_name} {event.profiles?.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(event.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {event.priority ?? 'medium'}
                        </Badge>
                        <Badge variant={event.status === 'open' ? 'destructive' : 'default'}>
                          {event.status}
                        </Badge>
                        
                        <div className="flex gap-1">
                          {event.status === 'open' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSOSStatus(event.id, 'acknowledged');
                              }}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSOSStatus(event.id, 'closed');
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="event-details">
          {selectedEvent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  SOS Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <p><strong>Name:</strong> {selectedEvent.profiles?.first_name} {selectedEvent.profiles?.last_name}</p>
                    <p><strong>Phone:</strong> {selectedEvent.profiles?.phone || 'Not provided'}</p>
                    <p><strong>Priority:</strong> <Badge className={getPriorityColor(selectedEvent.priority ?? 'medium')}>{selectedEvent.priority ?? 'medium'}</Badge></p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Event Information</h4>
                    <p><strong>Status:</strong> {selectedEvent.status}</p>
                    <p><strong>Time:</strong> {new Date(selectedEvent.created_at).toLocaleString()}</p>
                    <p><strong>Duration:</strong> {formatTimeAgo(selectedEvent.created_at)}</p>
                  </div>
                </div>

                {selectedEvent.location_data && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location Information
                    </h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <p><strong>Address:</strong> {selectedEvent.location_data.address || 'Address not available'}</p>
                      <p><strong>Coordinates:</strong> {selectedEvent.location_data.latitude}, {selectedEvent.location_data.longitude}</p>
                      <p><strong>Accuracy:</strong> ±{selectedEvent.location_data.accuracy}m</p>
                      
                      {selectedEvent.location_data.googleMapsLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(selectedEvent.location_data.googleMapsLink, '_blank')}
                        >
                          Open in Google Maps
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Select an Event</h3>
                <p className="text-muted-foreground">Choose an SOS event from the active events list to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="response-tools">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="destructive">
                  🚨 Dispatch Emergency Services
                </Button>
                <Button className="w-full" variant="outline">
                  📞 Call Primary Contact
                </Button>
                <Button className="w-full" variant="outline">
                  📧 Send Status Update
                </Button>
                <Button className="w-full" variant="outline">
                  📋 Create Incident Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Protocols</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Critical Priority (0-2 min)</h4>
                  <p className="text-sm text-muted-foreground">Immediate emergency services dispatch, call primary contact</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-600">High Priority (2-5 min)</h4>
                  <p className="text-sm text-muted-foreground">Contact user directly, assess situation, dispatch if needed</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-600">Medium Priority (5-15 min)</h4>
                  <p className="text-sm text-muted-foreground">Call user and emergency contacts, gather information</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">Low Priority (15+ min)</h4>
                  <p className="text-sm text-muted-foreground">Standard follow-up procedures</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};