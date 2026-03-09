import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bluetooth,
  HeartPulse,
  Battery,
  PlugZap,
  PowerOff,
  Mic,
  Speaker,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  History,
  ShoppingCart,
  Link as LinkIcon,
} from "lucide-react";
import { useBluetoothPendant } from "@/hooks/useBluetoothPendant";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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

interface SpeakerLink {
  id: string;
  platform: string;
  status: string;
  linked_at: string;
}

export function DevicesIntegrationsPage() {
  const { t } = useTranslation();
  const ble = useBluetoothPendant();
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [highThreshold, setHighThreshold] = useState(ble.thresholds.high_hr_threshold);
  const [lowThreshold, setLowThreshold] = useState(ble.thresholds.low_hr_threshold);
  const [alertEnabled, setAlertEnabled] = useState(ble.thresholds.alert_enabled);

  // Flic state
  const [flicButtons, setFlicButtons] = useState<FlicButton[]>([]);
  const [flicEvents, setFlicEvents] = useState<FlicEvent[]>([]);
  const [flicLoading, setFlicLoading] = useState(true);

  // Smart speaker links
  const [speakerLinks, setSpeakerLinks] = useState<SpeakerLink[]>([]);

  useEffect(() => {
    setHighThreshold(ble.thresholds.high_hr_threshold);
    setLowThreshold(ble.thresholds.low_hr_threshold);
    setAlertEnabled(ble.thresholds.alert_enabled);
  }, [ble.thresholds]);

  // Load Flic data
  useEffect(() => {
    const loadFlic = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: btns } = await supabase
          .from("devices_flic_buttons")
          .select("id, flic_uuid, name, last_voltage")
          .eq("owner_user", user.id)
          .order("updated_at", { ascending: false });

        setFlicButtons(btns || []);

        if (btns && btns[0]) {
          const { data: evs } = await supabase
            .from("devices_flic_events")
            .select("id, event, ts")
            .eq("button_id", btns[0].id)
            .order("ts", { ascending: false })
            .limit(5);
          setFlicEvents(evs || []);
        }
      } catch (e) {
        console.error("Failed to load Flic data", e);
      } finally {
        setFlicLoading(false);
      }
    };
    loadFlic();
  }, []);

  // Load smart speaker links
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("device_smart_speaker_links")
          .select("id, platform, status, linked_at")
          .eq("user_id", user.id);

        setSpeakerLinks(data || []);
      } catch {
        // Table may not exist yet
      }
    };
    loadLinks();
  }, []);

  const handleSaveThresholds = () => {
    ble.saveThresholds({
      high_hr_threshold: highThreshold,
      low_hr_threshold: lowThreshold,
      alert_enabled: alertEnabled,
    });
    setShowThresholdSettings(false);
  };

  const alexaLink = speakerLinks.find((l) => l.platform === "alexa");
  const googleLink = speakerLinks.find((l) => l.platform === "google_home");

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("dashboard.devicesTitle", { defaultValue: "Devices & Integrations" })}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.devicesDesc", { defaultValue: "Connect your Bluetooth pendant, smart speakers, and Flic buttons." })}
        </p>
      </div>

      {/* ==================== BLUETOOTH PENDANT ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-primary" />
            {t("devices.ble.title", { defaultValue: "Bluetooth Pendant" })}
            {ble.connected ? (
              <Badge variant="secondary" className="ml-auto">
                <PlugZap className="h-3 w-3 mr-1" /> Connected
              </Badge>
            ) : ble.useSimulator ? (
              <Badge variant="outline" className="ml-auto">
                <HeartPulse className="h-3 w-3 mr-1" /> Simulator
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto">Ready</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection controls */}
          <div className="flex flex-wrap items-center gap-3">
            {!ble.connected ? (
              <Button onClick={ble.connect} disabled={ble.connecting || (!ble.supported && !ble.useSimulator)}>
                <PlugZap className="mr-2 h-4 w-4" />
                {ble.connecting ? "Connecting..." : "Scan & Connect"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={ble.disconnect}>
                <PowerOff className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            )}
            <Button
              variant={ble.useSimulator ? "default" : "outline"}
              size="sm"
              onClick={ble.enableSimulator}
            >
              <HeartPulse className="mr-2 h-4 w-4" /> Simulator
            </Button>
            <Button
              variant={ble.useSimulator ? "outline" : "secondary"}
              size="sm"
              onClick={ble.disableSimulator}
              disabled={!ble.supported}
            >
              <Bluetooth className="mr-2 h-4 w-4" /> Bluetooth
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/devices/lifelink-sync-pendant">
                <ShoppingCart className="mr-2 h-4 w-4" /> Order Pendant
              </Link>
            </Button>
          </div>

          {/* Device info */}
          {ble.deviceName && (
            <p className="text-sm text-muted-foreground">
              Device: <span className="font-medium text-foreground">{ble.deviceName}</span>
            </p>
          )}

          {/* Live readings */}
          {(ble.heartRate !== null || ble.batteryPct !== null) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {ble.heartRate !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <HeartPulse className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{ble.heartRate}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </div>
                </div>
              )}
              {ble.batteryPct !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Battery className={`h-6 w-6 ${ble.batteryPct < 20 ? "text-red-500" : "text-green-500"}`} />
                  <div>
                    <p className="text-2xl font-bold">{ble.batteryPct}%</p>
                    <p className="text-xs text-muted-foreground">Battery</p>
                  </div>
                </div>
              )}
              {ble.thresholdAlert && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      {ble.thresholdAlert === "high" ? "High HR" : "Low HR"}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">Check wearer</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Threshold settings */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThresholdSettings(!showThresholdSettings)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              {showThresholdSettings ? "Hide" : "Alert"} Settings
            </Button>

            {showThresholdSettings && (
              <div className="mt-3 p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alert-enabled">Enable heart rate alerts</Label>
                  <Switch
                    id="alert-enabled"
                    checked={alertEnabled}
                    onCheckedChange={setAlertEnabled}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="high-threshold">High threshold (bpm)</Label>
                    <Input
                      id="high-threshold"
                      type="number"
                      value={highThreshold}
                      onChange={(e) => setHighThreshold(Number(e.target.value))}
                      min={80}
                      max={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="low-threshold">Low threshold (bpm)</Label>
                    <Input
                      id="low-threshold"
                      type="number"
                      value={lowThreshold}
                      onChange={(e) => setLowThreshold(Number(e.target.value))}
                      min={30}
                      max={70}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={handleSaveThresholds}>
                  Save Thresholds
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==================== SMART SPEAKERS ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Speaker className="h-5 w-5 text-primary" />
            {t("devices.smartSpeakers.title", { defaultValue: "Smart Speakers" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Alexa */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">A</span>
                  </div>
                  <div>
                    <p className="font-medium">Amazon Alexa</p>
                    <p className="text-xs text-muted-foreground">Voice SOS commands</p>
                  </div>
                </div>
                {alexaLink?.status === "active" ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Linked
                  </Badge>
                ) : (
                  <Badge variant="secondary">Coming Soon</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Say "Alexa, help help help" to trigger an emergency alert through all your Alexa devices.
              </p>
              <Button variant="outline" size="sm" disabled className="w-full">
                <LinkIcon className="mr-2 h-4 w-4" />
                Link Alexa Account
              </Button>
            </div>

            {/* Google Home */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">G</span>
                  </div>
                  <div>
                    <p className="font-medium">Google Home</p>
                    <p className="text-xs text-muted-foreground">Voice SOS commands</p>
                  </div>
                </div>
                {googleLink?.status === "active" ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Linked
                  </Badge>
                ) : (
                  <Badge variant="secondary">Coming Soon</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Say "Hey Google, emergency" to trigger an emergency alert through your Google Home devices.
              </p>
              <Button variant="outline" size="sm" disabled className="w-full">
                <LinkIcon className="mr-2 h-4 w-4" />
                Link Google Account
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Smart speaker integrations are currently in development. You'll be notified when they become available.
          </p>
        </CardContent>
      </Card>

      {/* ==================== FLIC BUTTON ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {t("devices.flic.title", { defaultValue: "Flic Button" })}
            {flicButtons.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {flicButtons.length} paired
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect a Flic 2 button for one-press emergency alerts. A long press (hold) automatically triggers your SOS emergency system.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/devices/lifelink-sync-pendant">
                <ShoppingCart className="mr-2 h-4 w-4" /> Order Flic 2
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new Event("open-device-settings"))}
            >
              <Bluetooth className="mr-2 h-4 w-4" /> Connect
            </Button>
          </div>

          {flicLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : flicButtons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No paired Flic buttons yet.</p>
          ) : (
            <>
              <div className="text-sm">
                <p>
                  <span className="font-medium">Primary:</span>{" "}
                  {flicButtons[0]?.name || flicButtons[0]?.flic_uuid}
                </p>
                {flicButtons[0]?.last_voltage != null && (
                  <p className="text-muted-foreground">
                    Battery: {flicButtons[0].last_voltage.toFixed(2)} V
                  </p>
                )}
              </div>

              {flicEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4" />
                    <span className="text-sm font-medium">Recent Events</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flicEvents.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="capitalize">
                            {e.event}
                            {e.event === "hold" && (
                              <Badge variant="destructive" className="ml-2 text-xs">SOS</Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(e.ts).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DevicesIntegrationsPage;
