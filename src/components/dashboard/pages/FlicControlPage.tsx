import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bluetooth, ShoppingCart, History } from "lucide-react";
import DeviceManagerButton from "@/components/devices/DeviceManagerButton";
import { useLocation } from "react-router-dom";

interface FlicButton {
  id: string;
  flic_uuid: string;
  name?: string | null;
  last_voltage?: number | null;
}

interface FlicEvent {
  id: string;
  event: string;
  ts: string;
}

export const FlicControlPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [buttons, setButtons] = useState<FlicButton[]>([]);
  const [events, setEvents] = useState<FlicEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: btns } = await supabase
          .from("devices_flic_buttons")
          .select("id, flic_uuid, name, last_voltage")
          .eq("owner_user", user.id)
          .order("updated_at", { ascending: false });

        setButtons(btns || []);

        if (btns && btns[0]) {
          const { data: evs } = await supabase
            .from("devices_flic_events")
            .select("id, event, ts")
            .eq("button_id", btns[0].id)
            .order("ts", { ascending: false })
            .limit(10);
          setEvents(evs || []);
        } else {
          setEvents([]);
        }
      } catch (e) {
        console.error("Failed to load Flic data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Auto-open device manager when ?open=connect is present
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'connect') {
      setTimeout(() => {
        window.dispatchEvent(new Event('open-device-settings'));
      }, 300);
    }
  }, [location.search]);

  const primaryButton = useMemo(() => buttons[0], [buttons]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Flic Control</h1>
            <p className="text-sm text-muted-foreground">Order, connect and check status of your Flic 2 SOS button.</p>
          </div>
          <Button disabled className="opacity-50 cursor-not-allowed">
            <ShoppingCart className="h-4 w-4 mr-2" /> Coming Soon
          </Button>
        </div>

        {/* Connect */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md bg-muted">
                <Bluetooth className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Connect your button</h2>
                  {primaryButton ? (
                    <Badge variant="secondary">Paired</Badge>
                  ) : (
                    <Badge>Not paired</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the manager below to connect via Bluetooth or enable the simulator for quick testing.
                </p>
                <div className="mt-4">
                  <DeviceManagerButton />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium mb-2">Status</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : buttons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paired buttons yet.</p>
            ) : (
              <div className="text-sm">
                <p>
                  <span className="font-medium">Primary button:</span> {primaryButton?.name || primaryButton?.flic_uuid}
                </p>
                {primaryButton?.last_voltage != null && (
                  <p className="text-muted-foreground">Battery: {primaryButton.last_voltage.toFixed(2)} V</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4" />
              <h2 className="text-lg font-medium">Recent events</h2>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet. Press and hold your button to trigger an event.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="capitalize">{e.event}</TableCell>
                      <TableCell>{new Date(e.ts).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlicControlPage;
