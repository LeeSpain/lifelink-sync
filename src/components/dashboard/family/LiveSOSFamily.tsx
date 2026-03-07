import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Clock, CheckCircle, Phone, AlertTriangle } from "lucide-react";

interface SOSEvent {
  id: string;
  user_id: string;
  status: 'active' | 'resolved' | 'canceled';
  trigger_location: any;
  address: string;
  created_at: string;
  metadata: any;
}

interface SOSLocation {
  id: string;
  event_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  created_at: string;
}

interface SOSAcknowledgement {
  id: string;
  event_id: string;
  family_user_id: string;
  acknowledged_at: string;
  message?: string;
}

const LiveSOSFamily = () => {
  const [activeEvent, setActiveEvent] = useState<SOSEvent | null>(null);
  const [currentLocation, setCurrentLocation] = useState<SOSLocation | null>(null);
  const [acknowledgements, setAcknowledgements] = useState<SOSAcknowledgement[]>([]);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for active SOS events
    checkActiveEvents();
    
    // Set up real-time subscriptions
    const eventChannel = supabase
      .channel('sos-events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sos_events' },
        (payload) => {
          console.log('SOS event change:', payload);
          if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
            setActiveEvent({
              ...payload.new,
              status: payload.new.status as 'active' | 'resolved' | 'canceled'
            } as SOSEvent);
            loadEventData(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            setActiveEvent({
              ...payload.new,
              status: payload.new.status as 'active' | 'resolved' | 'canceled'
            } as SOSEvent);
          }
        }
      )
      .subscribe();

    const locationChannel = supabase
      .channel('sos-locations')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_locations' },
        (payload) => {
          console.log('Location update:', payload);
          if (activeEvent && payload.new.event_id === activeEvent.id) {
            setCurrentLocation(payload.new as SOSLocation);
            updateMap(payload.new as SOSLocation);
          }
        }
      )
      .subscribe();

    const ackChannel = supabase
      .channel('sos-acknowledgements')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_acknowledgements' },
        (payload) => {
          console.log('Acknowledgement received:', payload);
          if (activeEvent && payload.new.event_id === activeEvent.id) {
            setAcknowledgements(prev => [...prev, payload.new as SOSAcknowledgement]);
          }
        }
      )
      .subscribe();

    return () => {
      eventChannel.unsubscribe();
      locationChannel.unsubscribe();
      ackChannel.unsubscribe();
    };
  }, [activeEvent?.id]);

  const checkActiveEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a family member with active SOS events
      const { data: events, error } = await supabase
        .from('sos_events')
        .select(`
          *,
          family_groups!inner(
            family_memberships!inner(user_id)
          )
        `)
        .eq('status', 'active')
        .eq('family_groups.family_memberships.user_id', user.id)
        .eq('family_groups.family_memberships.status', 'active');

      if (error) throw error;

      if (events && events.length > 0) {
        const event = events[0];
            setActiveEvent({
              ...event,
              status: event.status as 'active' | 'resolved' | 'canceled'
            });
        loadEventData(event.id);
      }

    } catch (error) {
      console.error('Error checking active events:', error);
    }
  };

  const loadEventData = async (eventId: string) => {
    try {
      // Load latest location
      const { data: locations, error: locError } = await supabase
        .from('sos_locations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (locError) throw locError;

      if (locations && locations.length > 0) {
        setCurrentLocation(locations[0]);
        updateMap(locations[0]);
      }

      // Load acknowledgements
      const { data: acks, error: ackError } = await supabase
        .from('sos_acknowledgements')
        .select('*')
        .eq('event_id', eventId)
        .order('acknowledged_at', { ascending: true });

      if (ackError) throw ackError;

      setAcknowledgements(acks || []);

      // Check if current user has acknowledged
      const { data: { user } } = await supabase.auth.getUser();
      if (user && acks) {
        const userAck = acks.find(ack => ack.family_user_id === user.id);
        setHasAcknowledged(!!userAck);
      }

    } catch (error) {
      console.error('Error loading event data:', error);
    }
  };

  const updateMap = (location: SOSLocation) => {
    if (!mapRef.current) return;

    // Simple map representation (in production, use Google Maps or similar)
    const mapHtml = `
      <div style="
        width: 100%; 
        height: 200px; 
        background: linear-gradient(45deg, #e3f2fd, #bbdefb);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: 2px solid #2196f3;
        position: relative;
      ">
        <div style="
          width: 20px;
          height: 20px;
          background: #f44336;
          border-radius: 50%;
          margin-bottom: 8px;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          background: white;
          padding: 8px 12px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        ">
          <div style="font-weight: bold; font-size: 12px;">${location.address || 'Location'}</div>
          <div style="font-size: 10px; color: #666;">
            ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
          </div>
          <div style="font-size: 10px; color: #666;">
            Accuracy: ±${location.accuracy || 0}m
          </div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>
      </div>
    `;

    mapRef.current.innerHTML = mapHtml;
  };

  const handleAcknowledge = async () => {
    if (!activeEvent || hasAcknowledged) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('sos_acknowledgements')
        .insert([{
          event_id: activeEvent.id,
          family_user_id: user.id,
          message: "Received & On It"
        }]);

      if (error) throw error;

      setHasAcknowledged(true);
      toast({
        title: "Acknowledged",
        description: "Your response has been sent to the family."
      });

    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to acknowledge SOS",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const callEmergencyServices = () => {
    window.open('tel:112', '_self');
  };

  const callMember = () => {
    if (activeEvent?.metadata?.user_phone) {
      window.open(`tel:${activeEvent.metadata.user_phone}`, '_self');
    }
  };

  if (!activeEvent) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">No active emergencies</span>
          </div>
          <p className="text-sm text-green-600 mt-2">
            You'll receive real-time alerts here if a family member triggers an SOS.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Emergency Banner */}
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-800">
          <strong>🚨 EMERGENCY ACTIVE</strong> - Family member needs help at {activeEvent.address}
        </AlertDescription>
      </Alert>

      {/* Live Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Live Location
            <Badge variant="destructive">ACTIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Loading map...</span>
          </div>
          {currentLocation && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Last updated: {new Date(currentLocation.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={handleAcknowledge}
          disabled={hasAcknowledged || isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {hasAcknowledged ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Acknowledged
            </>
          ) : (
            <>
              <Users className="h-5 w-5 mr-2" />
              {isLoading ? "Sending..." : "Received & On It"}
            </>
          )}
        </Button>

        <Button
          onClick={callMember}
          variant="outline"
          size="lg"
          disabled={!activeEvent?.metadata?.user_phone}
        >
          <Phone className="h-5 w-5 mr-2" />
          Call Member
        </Button>

        <Button
          onClick={callEmergencyServices}
          variant="destructive"
          size="lg"
        >
          <Phone className="h-5 w-5 mr-2" />
          Call 112
        </Button>
      </div>

      {/* Acknowledgements */}
      {acknowledgements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Responses ({acknowledgements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {acknowledgements.map((ack) => (
                <div key={ack.id} className="flex items-center gap-2 p-2 bg-green-50 rounded border-green-200 border">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    Family member responded at {new Date(ack.acknowledged_at).toLocaleTimeString()}
                  </span>
                  {ack.message && (
                    <Badge variant="secondary">{ack.message}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-3 w-3" />
          <span className="font-medium">Privacy Protection Active</span>
        </div>
        <p>Location is shared only during this active SOS. No device/battery telemetry is shared.</p>
      </div>
    </div>
  );
};

export default LiveSOSFamily;