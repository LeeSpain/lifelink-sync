import { useState, useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { supabase } from "@/integrations/supabase/client";

// BLE UUIDs
const HR_SERVICE = "heart_rate";
const HR_CHARACTERISTIC = "heart_rate_measurement";
const HR_SERVICE_UUID = "0000180D-0000-1000-8000-00805F9B34FB";
const HR_MEASUREMENT_UUID = "00002A37-0000-1000-8000-00805F9B34FB";
const BATT_SERVICE_UUID = "0000180F-0000-1000-8000-00805F9B34FB";
const BATT_LEVEL_UUID = "00002A19-0000-1000-8000-00805F9B34FB";

export interface BLEDeviceStatus {
  connected: boolean;
  connecting: boolean;
  deviceName: string;
  heartRate: number | null;
  batteryPct: number | null;
  supported: boolean;
  useSimulator: boolean;
}

export interface AlertThresholds {
  high_hr_threshold: number;
  low_hr_threshold: number;
  alert_enabled: boolean;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  high_hr_threshold: 120,
  low_hr_threshold: 50,
  alert_enabled: true,
};

function parseHeartRate(event: any): number {
  try {
    const value: DataView = event.target?.value ?? event;
    const flags = value.getUint8(0);
    const is16Bit = (flags & 0x01) === 0x01;
    return is16Bit ? value.getUint16(1, true) : value.getUint8(1);
  } catch {
    return 0;
  }
}

export function useBluetoothPendant() {
  const [status, setStatus] = useState<BLEDeviceStatus>({
    connected: false,
    connecting: false,
    deviceName: "",
    heartRate: null,
    batteryPct: null,
    supported: false,
    useSimulator: true,
  });
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [thresholdAlert, setThresholdAlert] = useState<"high" | "low" | null>(null);

  const deviceRef = useRef<any>(null);
  const serverRef = useRef<any>(null);
  const hrCharRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const lastAlertRef = useRef<number>(0);

  // Check BLE support on mount
  useEffect(() => {
    setStatus((s) => ({
      ...s,
      supported: Boolean(navigator.bluetooth) || Capacitor.isNativePlatform(),
    }));
    loadThresholds();
  }, []);

  // Simulator
  useEffect(() => {
    if (status.useSimulator && !status.connected) {
      if (!simIntervalRef.current) {
        simIntervalRef.current = window.setInterval(() => {
          setStatus((s) => {
            const base = s.heartRate ?? 72;
            const next = Math.max(58, Math.min(120, base + (Math.random() * 6 - 3)));
            const battBase = s.batteryPct ?? 88;
            const battNext = Math.max(1, Math.min(100, battBase - (Math.random() < 0.1 ? 1 : 0)));
            return { ...s, heartRate: Math.round(next), batteryPct: battNext };
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
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  }, [status.useSimulator, status.connected]);

  // Heart rate threshold monitoring
  useEffect(() => {
    if (!thresholds.alert_enabled || status.heartRate === null) return;

    const now = Date.now();
    // Cooldown: don't re-alert within 60 seconds
    if (now - lastAlertRef.current < 60000) return;

    if (status.heartRate > thresholds.high_hr_threshold) {
      setThresholdAlert("high");
      lastAlertRef.current = now;
    } else if (status.heartRate < thresholds.low_hr_threshold) {
      setThresholdAlert("low");
      lastAlertRef.current = now;
    } else {
      setThresholdAlert(null);
    }
  }, [status.heartRate, thresholds]);

  const loadThresholds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("device_ble_alert_thresholds")
        .select("high_hr_threshold, low_hr_threshold, alert_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setThresholds({
          high_hr_threshold: data.high_hr_threshold,
          low_hr_threshold: data.low_hr_threshold,
          alert_enabled: data.alert_enabled,
        });
      }
    } catch (err) {
      console.error("Failed to load BLE thresholds:", err);
    }
  };

  const saveThresholds = async (newThresholds: AlertThresholds) => {
    setThresholds(newThresholds);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("device_ble_alert_thresholds")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("device_ble_alert_thresholds")
          .update(newThresholds)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("device_ble_alert_thresholds")
          .insert({ user_id: user.id, ...newThresholds });
      }
    } catch (err) {
      console.error("Failed to save BLE thresholds:", err);
    }
  };

  const persistDevice = async (name: string, deviceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("device_ble_pendants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("device_ble_pendants")
          .update({
            device_name: name,
            device_id: deviceId,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("device_ble_pendants")
          .insert({
            user_id: user.id,
            device_name: name,
            device_id: deviceId,
            last_seen_at: new Date().toISOString(),
          });
      }
    } catch (err) {
      console.error("Failed to persist BLE device:", err);
    }
  };

  const updateDeviceReadings = async (hr: number | null, battery: number | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const update: Record<string, unknown> = {
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (hr !== null) update.last_heart_rate = hr;
      if (battery !== null) update.last_battery_pct = battery;

      await supabase
        .from("device_ble_pendants")
        .update(update)
        .eq("user_id", user.id);
    } catch {
      // Best effort
    }
  };

  const connect = useCallback(async () => {
    try {
      setStatus((s) => ({ ...s, connecting: true }));

      if (Capacitor.isNativePlatform()) {
        await BleClient.initialize();
        setStatus((s) => ({ ...s, useSimulator: false }));

        const device = await BleClient.requestDevice({ services: [HR_SERVICE_UUID] });
        deviceIdRef.current = device.deviceId;
        const name = device.name ?? "BLE device";
        setStatus((s) => ({ ...s, deviceName: name }));

        await BleClient.connect(device.deviceId, () => {
          setStatus((s) => ({ ...s, connected: false, deviceName: "" }));
          deviceIdRef.current = null;
        });
        setStatus((s) => ({ ...s, connected: true }));

        await persistDevice(name, device.deviceId);

        await BleClient.startNotifications(
          device.deviceId,
          HR_SERVICE_UUID,
          HR_MEASUREMENT_UUID,
          (value: DataView) => {
            const hr = parseHeartRate(value);
            if (hr) {
              setStatus((s) => ({ ...s, heartRate: hr }));
              updateDeviceReadings(hr, null);
            }
          },
        );

        try {
          const batt: DataView = await BleClient.read(device.deviceId, BATT_SERVICE_UUID, BATT_LEVEL_UUID);
          const pct = batt.getUint8(0);
          setStatus((s) => ({ ...s, batteryPct: pct }));
          updateDeviceReadings(null, pct);
        } catch {
          // Battery service optional
        }
      } else if (navigator.bluetooth) {
        setStatus((s) => ({ ...s, useSimulator: false }));

        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [HR_SERVICE] }],
          optionalServices: ["battery_service"],
        });
        deviceRef.current = device;
        const name = device?.name || "Unknown device";
        setStatus((s) => ({ ...s, deviceName: name }));

        const server = await device.gatt!.connect();
        serverRef.current = server;
        setStatus((s) => ({ ...s, connected: true }));

        await persistDevice(name, device.id || "web-ble");

        const service = await server.getPrimaryService(HR_SERVICE);
        const characteristic = await service.getCharacteristic(HR_CHARACTERISTIC);
        hrCharRef.current = characteristic;
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", (event: any) => {
          const hr = parseHeartRate(event);
          if (hr) {
            setStatus((s) => ({ ...s, heartRate: hr }));
            updateDeviceReadings(hr, null);
          }
        });

        try {
          const battSvc = await server.getPrimaryService("battery_service");
          const battChar = await battSvc.getCharacteristic("battery_level");
          const value: DataView = await battChar.readValue();
          const pct = value.getUint8(0);
          setStatus((s) => ({ ...s, batteryPct: pct }));
          updateDeviceReadings(null, pct);
        } catch {
          // Battery service optional
        }
      } else {
        setStatus((s) => ({ ...s, useSimulator: true }));
        return;
      }
    } catch (e) {
      console.warn("Bluetooth connect error", e);
      setStatus((s) => ({ ...s, connected: false, useSimulator: true }));
    } finally {
      setStatus((s) => ({ ...s, connecting: false }));
    }
  }, []);

  const disconnect = useCallback(async () => {
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
      setStatus((s) => ({ ...s, connected: false, deviceName: "" }));
    }
  }, []);

  const enableSimulator = useCallback(() => {
    setStatus((s) => ({ ...s, useSimulator: true }));
  }, []);

  const disableSimulator = useCallback(() => {
    setStatus((s) => ({ ...s, useSimulator: false }));
  }, []);

  const clearAlert = useCallback(() => {
    setThresholdAlert(null);
  }, []);

  return {
    ...status,
    thresholds,
    thresholdAlert,
    connect,
    disconnect,
    enableSimulator,
    disableSimulator,
    saveThresholds,
    clearAlert,
  };
}
