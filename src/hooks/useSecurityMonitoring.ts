import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/security';

interface SecurityMetrics {
  totalEvents: number;
  highRiskEvents: number;
  authFailures: number;
  activeBlocks: number;
  lastUpdate: Date;
}

interface SecurityAlert {
  id: string;
  type: 'high_risk' | 'repeated_failures' | 'new_threat' | 'system_alert';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata?: any;
}

export function useSecurityMonitoring() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    highRiskEvents: 0,
    authFailures: 0,
    activeBlocks: 0,
    lastUpdate: new Date()
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const updateMetrics = async () => {
    try {
      // Get security events count
      const { count: eventsCount } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get high risk events
      const { count: highRiskCount } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .or('severity.eq.high,risk_score.gt.50')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get auth failures
      const { count: failuresCount } = await supabase
        .from('auth_failures')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get active blocks
      const { count: blockedCount } = await supabase
        .from('auth_failures')
        .select('*', { count: 'exact', head: true })
        .gt('blocked_until', new Date().toISOString());

      setMetrics({
        totalEvents: eventsCount || 0,
        highRiskEvents: highRiskCount || 0,
        authFailures: failuresCount || 0,
        activeBlocks: blockedCount || 0,
        lastUpdate: new Date()
      });

      // Generate alerts based on thresholds
      const newAlerts: SecurityAlert[] = [];

      if ((highRiskCount || 0) > 10) {
        newAlerts.push({
          id: 'high-risk-' + Date.now(),
          type: 'high_risk',
          message: `${highRiskCount} high-risk security events detected in the last 24 hours`,
          severity: 'high',
          timestamp: new Date(),
          metadata: { count: highRiskCount }
        });
      }

      if ((failuresCount || 0) > 50) {
        newAlerts.push({
          id: 'auth-failures-' + Date.now(),
          type: 'repeated_failures',
          message: `${failuresCount} authentication failures in the last 24 hours`,
          severity: 'medium',
          timestamp: new Date(),
          metadata: { count: failuresCount }
        });
      }

      if ((blockedCount || 0) > 5) {
        newAlerts.push({
          id: 'active-blocks-' + Date.now(),
          type: 'new_threat',
          message: `${blockedCount} IP addresses currently blocked`,
          severity: 'medium',
          timestamp: new Date(),
          metadata: { count: blockedCount }
        });
      }

      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error updating security metrics:', error);
      logSecurityEvent('monitoring_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'security_monitoring',
        timestamp: new Date().toISOString()
      });
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    updateMetrics();
    
    // Update every 5 minutes
    const interval = setInterval(updateMetrics, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    logSecurityEvent('alert_acknowledged', {
      alert_id: alertId,
      timestamp: new Date().toISOString(),
      component: 'security_monitoring'
    });
  };

  const triggerSecurityScan = async () => {
    try {
      // Log security scan initiation
      logSecurityEvent('security_scan_initiated', {
        initiated_by: 'admin',
        timestamp: new Date().toISOString(),
        component: 'security_monitoring'
      });

      // Trigger comprehensive checks
      await updateMetrics();
      
      // Check for suspicious patterns
      const { data: recentEvents } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false });

      if (recentEvents && recentEvents.length > 100) {
        setAlerts(prev => [...prev, {
          id: 'scan-alert-' + Date.now(),
          type: 'system_alert',
          message: `Unusual activity detected: ${recentEvents.length} events in the last hour`,
          severity: 'high',
          timestamp: new Date(),
          metadata: { eventCount: recentEvents.length, scanType: 'manual' }
        }]);
      }

      logSecurityEvent('security_scan_completed', {
        events_analyzed: recentEvents?.length || 0,
        alerts_generated: alerts.length,
        timestamp: new Date().toISOString(),
        component: 'security_monitoring'
      });

    } catch (error) {
      console.error('Error during security scan:', error);
      logSecurityEvent('security_scan_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        component: 'security_monitoring'
      });
    }
  };

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring,
    updateMetrics,
    acknowledgeAlert,
    triggerSecurityScan
  };
}