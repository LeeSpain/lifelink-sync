import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bluetooth, ExternalLink } from "lucide-react";

interface AdminFlicButton {
  id: string;
  owner_user: string | null;
  flic_uuid: string | null;
  name?: string | null;
  last_voltage?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface AdminFlicEvent {
  id: string;
  button_id: string;
  event: string;
  ts: string;
}

const projectId = "rqahqicfafnxlmdjcozu"; // for webhook URL display

const FlicControlAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [buttons, setButtons] = useState<AdminFlicButton[]>([]);
  const [events, setEvents] = useState<AdminFlicEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: btns, error: btnErr } = await supabase
          .from("devices_flic_buttons")
          .select("id, owner_user, flic_uuid, name, last_voltage, updated_at, created_at")
          .order("updated_at", { ascending: false });
        if (btnErr) throw btnErr;
        setButtons(btns || []);

        const { data: evs, error: evErr } = await supabase
          .from("devices_flic_events")
          .select("id, button_id, event, ts")
          .order("ts", { ascending: false })
          .limit(50);
        if (evErr) throw evErr;
        setEvents(evs || []);
      } catch (e) {
        console.error("Failed to load Flic admin data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Flic Control</h1>
          <p className="text-sm text-muted-foreground">Full admin area for Flic buttons, events, and web/PWA fallback.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <a href={`/devices/lifelink-sync-pendant`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Device landing
            </a>
          </Button>
        </div>
      </div>

      {/* Webhook */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Web/PWA Fallback Webhook</h2>
              <p className="text-sm text-muted-foreground mt-1">Configure the Flic app Internet Request to POST JSON here:</p>
              <code className="block mt-3 text-xs p-3 rounded-md bg-muted/50 border border-border break-all">
                https://{projectId}.functions.supabase.co/flic-webhook
              </code>
            </div>
            <div className="p-2 rounded-md bg-muted"><Bluetooth className="h-5 w-5" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Buttons</h2>
            <Badge variant={buttons.length ? "secondary" : "default"}>{buttons.length} found</Badge>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : buttons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Flic buttons stored yet.</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Flic UUID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Voltage</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buttons.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs">{b.id}</TableCell>
                      <TableCell className="text-xs">{b.owner_user || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{b.flic_uuid || "—"}</TableCell>
                      <TableCell className="text-sm">{b.name || "—"}</TableCell>
                      <TableCell className="text-sm">{b.last_voltage != null ? `${b.last_voltage.toFixed(2)} V` : "—"}</TableCell>
                      <TableCell className="text-xs">{b.updated_at ? new Date(b.updated_at).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Events</h2>
            <Badge variant={events.length ? "secondary" : "default"}>{events.length}</Badge>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Button</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="capitalize">{e.event}</TableCell>
                      <TableCell className="font-mono text-xs">{e.button_id}</TableCell>
                      <TableCell className="text-xs">{new Date(e.ts).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlicControlAdminPage;
