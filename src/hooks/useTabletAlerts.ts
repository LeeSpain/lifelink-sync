import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  playCriticalAlert,
  playWarningChime,
  playInfoPing,
  stopAllSounds,
} from '@/utils/tabletSounds';

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface TabletAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  who?: string;
  location?: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

interface UseTabletAlertsOptions {
  userId: string | undefined;
  onAlert?: (alert: TabletAlert) => void;
}

export function useTabletAlerts({ userId, onAlert }: UseTabletAlertsOptions) {
  const [alerts, setAlerts] = useState<TabletAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<TabletAlert | null>(null);
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  // Auto-dismiss warning alerts after 60s
  useEffect(() => {
    if (!activeAlert || activeAlert.level !== 'warning') return;
    const timer = setTimeout(() => {
      acknowledgeAlert(activeAlert.id);
    }, 60_000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  const pushAlert = useCallback((alert: TabletAlert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 50));

    // Only set as active if higher priority or no current active
    setActiveAlert((current) => {
      if (!current || current.acknowledged) return alert;
      const priority: Record<AlertLevel, number> = { critical: 3, warning: 2, info: 1 };
      if (priority[alert.level] >= priority[current.level]) return alert;
      return current;
    });

    // Play sound based on level
    switch (alert.level) {
      case 'critical':
        playCriticalAlert();
        break;
      case 'warning':
        playWarningChime();
        break;
      case 'info':
        playInfoPing();
        break;
    }

    onAlertRef.current?.(alert);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    stopAllSounds();
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    setActiveAlert((current) => {
      if (current?.id === alertId) return null;
      return current;
    });
  }, []);

  // Subscribe to SOS events
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('tablet-sos-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_events',
        },
        (payload) => {
          const row = payload.new as any;
          pushAlert({
            id: `sos-${row.id}`,
            level: 'critical',
            title: 'Emergency SOS',
            message: `${row.user_name || 'A member'} has triggered an emergency SOS alert.`,
            who: row.user_name || 'Unknown',
            location: row.location_description || row.latitude ? `${row.latitude}, ${row.longitude}` : 'Unknown location',
            timestamp: row.created_at || new Date().toISOString(),
            acknowledged: false,
            source: 'sos_events',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, pushAlert]);

  // Subscribe to family_alerts for medication/check-in/messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('tablet-family-alerts-enhanced')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_alerts',
          filter: `family_user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          const data = row.alert_data || {};
          const alertType = row.alert_type as string;

          if (alertType === 'medication_missed') {
            pushAlert({
              id: `med-${row.id}`,
              level: 'warning',
              title: 'Missed Medication',
              message: data.message || 'A medication reminder was missed.',
              who: data.member_name || data.from_name,
              timestamp: row.created_at || new Date().toISOString(),
              acknowledged: false,
              source: 'medication',
            });
          } else if (alertType === 'checkin_missed') {
            pushAlert({
              id: `checkin-${row.id}`,
              level: 'warning',
              title: 'Missed Check-in',
              message: data.message || 'A daily check-in was missed.',
              who: data.member_name || data.from_name,
              timestamp: row.created_at || new Date().toISOString(),
              acknowledged: false,
              source: 'checkin',
            });
          } else if (alertType === 'family_message') {
            pushAlert({
              id: `msg-${row.id}`,
              level: 'info',
              title: 'New Message',
              message: data.message || 'New message from family.',
              who: data.from_name,
              timestamp: row.created_at || new Date().toISOString(),
              acknowledged: false,
              source: 'message',
            });
          } else if (alertType === 'low_battery') {
            pushAlert({
              id: `bat-${row.id}`,
              level: 'info',
              title: 'Low Battery',
              message: data.message || 'Device battery is below 20%.',
              who: data.device_name,
              timestamp: row.created_at || new Date().toISOString(),
              acknowledged: false,
              source: 'battery',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, pushAlert]);

  return {
    alerts,
    activeAlert,
    acknowledgeAlert,
    pushAlert,
  };
}
