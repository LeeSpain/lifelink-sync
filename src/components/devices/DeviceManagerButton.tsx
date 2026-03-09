import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bluetooth, Cog, HeartPulse, PlugZap, PowerOff, Mic, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBluetoothPendant } from "@/hooks/useBluetoothPendant";

const DeviceManagerButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    connected,
    connecting,
    deviceName,
    heartRate,
    batteryPct,
    supported,
    useSimulator,
    thresholdAlert,
    connect,
    disconnect,
    enableSimulator,
    disableSimulator,
    clearAlert,
  } = useBluetoothPendant();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-device-settings", handler);
    return () => {
      window.removeEventListener("open-device-settings", handler);
    };
  }, []);

  // Show threshold alert toast
  useEffect(() => {
    if (thresholdAlert) {
      toast({
        title: thresholdAlert === "high" ? "High Heart Rate Alert" : "Low Heart Rate Alert",
        description: `Heart rate ${heartRate} bpm is ${thresholdAlert === "high" ? "above" : "below"} threshold. Check on the wearer.`,
        variant: "destructive",
      });
      clearAlert();
    }
  }, [thresholdAlert]);

  const connectAlexa = () => toast({ title: "Amazon Alexa", description: "Alexa integration coming soon. Visit Devices & Integrations in your dashboard for updates." });
  const connectGoogle = () => toast({ title: "Google Home", description: "Google Home integration coming soon. Visit Devices & Integrations in your dashboard for updates." });

  const StatusBadge = useMemo(() => (
    connected ? (
      <Badge variant="secondary" className="gap-1"> <PlugZap className="h-3 w-3" /> Connected </Badge>
    ) : useSimulator ? (
      <Badge variant="outline" className="gap-1"> <HeartPulse className="h-3 w-3" /> Simulator </Badge>
    ) : supported ? (
      <Badge variant="outline">Ready</Badge>
    ) : (
      <Badge variant="destructive">Not supported</Badge>
    )
  ), [connected, useSimulator, supported]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="shadow-lg hover-scale" size="icon" aria-label="Devices & Settings">
            <Cog className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Device Connections</DialogTitle>
            <DialogDescription>Connect your Bluetooth pendant and link smart speakers.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Bluetooth Pendant */}
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Bluetooth Pendant</div>
                  <div className="text-xs text-muted-foreground">{deviceName || (useSimulator ? "Simulator" : "Not connected")}</div>
                </div>
                {StatusBadge}
              </div>

              {/* Heart rate + battery display */}
              {(heartRate !== null || batteryPct !== null) && (
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  {heartRate !== null && (
                    <span className="flex items-center gap-1">
                      <HeartPulse className="h-3 w-3 text-red-500" />
                      {heartRate} bpm
                    </span>
                  )}
                  {batteryPct !== null && (
                    <span>{batteryPct}% battery</span>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!connected ? (
                  <Button onClick={connect} disabled={connecting || (!supported && !useSimulator)}>
                    <PlugZap className="mr-2 h-4 w-4" /> {connecting ? "Connecting..." : "Scan & Connect"}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={disconnect}>
                    <PowerOff className="mr-2 h-4 w-4" /> Disconnect
                  </Button>
                )}

                <Button variant={useSimulator ? "default" : "outline"} size="sm" onClick={enableSimulator}>
                  <HeartPulse className="mr-2 h-4 w-4" /> Simulator
                </Button>
                <Button variant={useSimulator ? "outline" : "secondary"} size="sm" onClick={disableSimulator} disabled={!supported}>
                  <Bluetooth className="mr-2 h-4 w-4" /> Bluetooth
                </Button>
              </div>
            </div>

            <Separator />

            {/* Smart Speakers */}
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <div className="mb-2 text-sm font-medium">Smart Speakers</div>
              <p className="text-xs text-muted-foreground mb-3">
                Link your preferred assistant to enable voice SOS commands.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={connectAlexa}>
                  <Mic className="mr-2 h-4 w-4" /> Connect Alexa
                </Button>
                <Button variant="outline" onClick={connectGoogle}>
                  <Megaphone className="mr-2 h-4 w-4" /> Connect Google Home
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceManagerButton;
