import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, MapPin, Phone, CheckCircle } from "lucide-react";

const TestFamilySOSSystem = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const { toast } = useToast();

  const triggerTestSOS = async () => {
    setIsLoading(true);
    try {
      // Get current location (mock data for testing)
      const testLocation = {
        lat: 52.3676,
        lng: 4.9041,
        accuracy: 10,
        address: "Test Location, Amsterdam, Netherlands"
      };

      const testProfile = {
        first_name: "Test",
        last_name: "User",
        phone: "+31612345678"
      };

      // Call enhanced SOS system
      const { data, error } = await supabase.functions.invoke('family-sos-enhanced', {
        body: {
          location: testLocation,
          user_profile: testProfile,
          metadata: {
            test_mode: true,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setLastEventId(data.event_id);
      toast({
        title: "Test SOS Triggered",
        description: `Family alerts sent: ${data.family_alerts_sent}, Call-only contacts: ${data.call_only_contacts}`
      });

    } catch (error) {
      console.error('Error triggering test SOS:', error);
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Failed to trigger test SOS",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeTestSOS = async () => {
    if (!lastEventId) return;

    try {
      const { data, error } = await supabase.functions.invoke('family-sos-acknowledge', {
        body: {
          event_id: lastEventId,
          message: "Test acknowledgement - Received & On It"
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Test Acknowledgement Sent",
        description: "Family member response recorded successfully"
      });

    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      toast({
        title: "Acknowledgement Error",
        description: error instanceof Error ? error.message : "Failed to acknowledge SOS",
        variant: "destructive"
      });
    }
  };

  const resolveTestSOS = async () => {
    if (!lastEventId) return;

    try {
      const { error } = await supabase
        .from('sos_events')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', lastEventId);

      if (error) throw error;

      toast({
        title: "Test SOS Resolved",
        description: "SOS event has been marked as resolved"
      });

      setLastEventId(null);

    } catch (error) {
      console.error('Error resolving SOS:', error);
      toast({
        title: "Resolution Error",
        description: error instanceof Error ? error.message : "Failed to resolve SOS",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-orange-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Test Family SOS System
          <Badge variant="outline">Testing Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test the complete family access SOS system including alerts, real-time components, and acknowledgements.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={triggerTestSOS}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isLoading ? "Triggering..." : "Trigger Test SOS"}
            </Button>

            <Button
              onClick={acknowledgeTestSOS}
              disabled={!lastEventId}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Acknowledge
            </Button>

            <Button
              onClick={resolveTestSOS}
              disabled={!lastEventId}
              variant="secondary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Test SOS
            </Button>
          </div>

          {lastEventId && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Active Test SOS</span>
              </div>
              <p className="text-sm text-yellow-700">
                Event ID: {lastEventId}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Family members should receive real-time alerts. Use "Test Acknowledge" to simulate a family response.
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <strong>What this tests:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Enhanced SOS event creation with family groups</li>
              <li>• Real-time family alerts and notifications</li>
              <li>• Family member acknowledgement system</li>
              <li>• Call sequence management and email notifications</li>
              <li>• Privacy-focused location sharing (active SOS only)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestFamilySOSSystem;