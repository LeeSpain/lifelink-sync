import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bluetooth, Cog, HeartPulse, PlugZap, PowerOff, Mic, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Capacitor } from "@capacitor/core";
import { BleClient } from "@capacitor-community/bluetooth-le";

// Web Bluetooth types are provided by DOM lib; fallback casts are used where needed.

const hrService = "heart_rate";
const hrCharacteristic = "heart_rate_measurement";
// BLE UUIDs for mobile (Capacitor)
const HR_SERVICE_UUID = "0000180D-0000-1000-8000-00805F9B34FB";
const HR_MEASUREMENT_UUID = "00002A37-0000-1000-8000-00805F9B34FB";
const BATT_SERVICE_UUID = "0000180F-0000-1000-8000-00805F9B34FB";
const BATT_LEVEL_UUID = "00002A19-0000-1000-8000-00805F9B34FB";

const parseHeartRate = (event: any): number => {
  try {
    const value: DataView = event.target.value;
    const flags = value.getUint8(0);
    const is16Bit = (flags & 0x01) === 0x01;
    return is16Bit ? value.getUint16(1, /*littleEndian*/ true) : value.getUint8(1);
  } catch {
    return 0;
  }
};

const DeviceManagerButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState<boolean>(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string>("");
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [batteryPct, setBatteryPct] = useState<number | null>(null);
  const [useSimulator, setUseSimulator] = useState<boolean>(true);
  const { toast } = useToast();

  const deviceRef = useRef<any>(null);
  const serverRef = useRef<any>(null);
  const hrCharRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(Boolean(navigator.bluetooth) || Capacitor.isNativePlatform());

    const handler = () => setOpen(true);
    window.addEventListener("open-device-settings", handler);
    return () => {
      window.removeEventListener("open-device-settings", handler);
    };
  }, []);

  useEffect(() => {
    if (useSimulator && open && !connected) {
      // start simulator
      if (!simIntervalRef.current) {
        simIntervalRef.current = window.setInterval(() => {
          setHeartRate((prev) => {
            const base = prev ?? 72;
            const next = Math.max(58, Math.min(120, base + (Math.random() * 6 - 3)));
            return Math.round(next);
          });
          setBatteryPct((prev) => {
            const base = prev ?? 88;
            return Math.max(1, Math.min(100, base - (Math.random() < 0.1 ? 1 : 0)));
          });
        }, 1200);
      }
      return () => {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      };
    }
    // Cleanup when not simulating
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  }, [useSimulator, open, connected]);

  const connect = async () => {
    try {
      setConnecting(true);
      if (Capacitor.isNativePlatform()) {
        await BleClient.initialize();
        setUseSimulator(false);
        const device = await BleClient.requestDevice({ services: [HR_SERVICE_UUID] });
        deviceIdRef.current = device.deviceId;
        setDeviceName(device.name ?? "BLE device");
        await BleClient.connect(device.deviceId, () => {
          setConnected(false);
          setDeviceName("");
          deviceIdRef.current = null;
        });
        setConnected(true);

        await BleClient.startNotifications(device.deviceId, HR_SERVICE_UUID, HR_MEASUREMENT_UUID, (value: DataView) => {
          const hr = parseHeartRate({ target: { value } } as any);
          if (hr) setHeartRate(hr);
        });

        try {
          const batt: DataView = await BleClient.read(device.deviceId, BATT_SERVICE_UUID, BATT_LEVEL_UUID);
          setBatteryPct(batt.getUint8(0));
        } catch {}
      } else if (navigator.bluetooth) {
        setUseSimulator(false);
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [hrService] }],
          optionalServices: ["battery_service"],
        });
        deviceRef.current = device;
        setDeviceName(device?.name || "Unknown device");

        const server = await device.gatt.connect();
        serverRef.current = server;
        setConnected(true);

        // Heart Rate notifications
        const service = await server.getPrimaryService(hrService);
        const characteristic = await service.getCharacteristic(hrCharacteristic);
        hrCharRef.current = characteristic;
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", (event: any) => {
          const hr = parseHeartRate(event);
          if (hr) setHeartRate(hr);
        });

        // Battery (best-effort)
        try {
          const battSvc = await server.getPrimaryService("battery_service");
          const battChar = await battSvc.getCharacteristic("battery_level");
          const value: DataView = await battChar.readValue();
          setBatteryPct(value.getUint8(0));
        } catch {}
      } else {
        setUseSimulator(true);
        setOpen(true);
        return;
      }
    } catch (e) {
      console.warn("Bluetooth connect error", e);
      setConnected(false);
      setUseSimulator(true);
    } finally {
      setConnecting(false);
      setOpen(true);
    }
  };

  const disconnect = async () => {
    try {
      if (hrCharRef.current) {
        try { await hrCharRef.current.stopNotifications(); } catch {}
        hrCharRef.current = null;
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      if (deviceIdRef.current) {
        try { await BleClient.disconnect(deviceIdRef.current); } catch {}
        deviceIdRef.current = null;
      }
    } finally {
      setConnected(false);
      setDeviceName("");
    }
  };

  const connectAlexa = () => toast({ title: "Alexa linking", description: "Coming soon" });
  const connectGoogle = () => toast({ title: "Google Home linking", description: "Coming soon" });

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

                <Button variant={useSimulator ? "default" : "outline"} size="sm" onClick={() => setUseSimulator(true)}>
                  <HeartPulse className="mr-2 h-4 w-4" /> Simulator
                </Button>
                <Button variant={useSimulator ? "outline" : "secondary"} size="sm" onClick={() => setUseSimulator(false)} disabled={!supported}>
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
