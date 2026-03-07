import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Eye, RefreshCw, Clock, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  source_component: string;
  metadata: any;
  risk_score: number;
  created_at: string;
  user_id?: string;
  ip_address?: string;
}

interface AuthFailure {
  id: string;
  email: string;
  ip_address: string;
  attempt_count: number;
  failure_reason: string;
  blocked_until: string | null;
  last_attempt_at: string;
}

export default function SecurityMonitoringPanel() {
  const queryClient = useQueryClient();

  const { data: securityEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SecurityEvent[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: authFailures, isLoading: failuresLoading } = useQuery({
    queryKey: ['auth-failures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_failures')
        .select('*')
        .order('last_attempt_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      return data as AuthFailure[];
    },
    refetchInterval: 30000,
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['security-events'] });
    queryClient.invalidateQueries({ queryKey: ['auth-failures'] });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('failure') || eventType.includes('denied')) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (eventType.includes('success') || eventType.includes('signin')) {
      return <Shield className="h-4 w-4 text-success" />;
    }
    return <Eye className="h-4 w-4 text-muted-foreground" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getHighRiskEvents = () => {
    return securityEvents?.filter(event => 
      event.severity === 'high' || 
      event.risk_score > 50 ||
      event.event_type.includes('failure')
    ).slice(0, 10) || [];
  };

  const getActiveThreats = () => {
    const now = new Date();
    return authFailures?.filter(failure => {
      if (!failure.blocked_until) return false;
      return new Date(failure.blocked_until) > now;
    }) || [];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events (24h)</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityEvents?.filter(event => {
                const eventDate = new Date(event.created_at);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return eventDate > dayAgo;
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {getHighRiskEvents().length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {authFailures?.reduce((sum, failure) => sum + failure.attempt_count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {authFailures?.length || 0} unique sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Blocks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getActiveThreats().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Temporarily blocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Security Monitoring</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={eventsLoading || failuresLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${eventsLoading || failuresLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* High Priority Alerts */}
      {getHighRiskEvents().length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getHighRiskEvents().length} high-priority security events require attention.
            Review the events below for potential threats.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventsLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading events...</p>
                </div>
              ) : securityEvents?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No security events recorded
                </p>
              ) : (
                securityEvents?.map((event) => (
                  <div key={event.id} className="border-l-2 border-muted pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.event_type)}
                        <span className="font-medium text-sm">
                          {event.event_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(event.created_at)}
                      </span>
                    </div>
                    
                    {event.metadata && (
                      <div className="text-xs text-muted-foreground">
                        {event.metadata.email && <span>Email: {event.metadata.email} • </span>}
                        {event.metadata.ip_address && <span>IP: {event.metadata.ip_address} • </span>}
                        {event.risk_score > 0 && <span>Risk Score: {event.risk_score}</span>}
                        {event.source_component && <span> • Source: {event.source_component}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Failures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Authentication Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {failuresLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading failures...</p>
                </div>
              ) : authFailures?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No authentication failures recorded
                </p>
              ) : (
                authFailures?.map((failure) => (
                  <div key={failure.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{failure.email}</span>
                        <Badge variant="destructive">
                          {failure.attempt_count} attempts
                        </Badge>
                        {failure.blocked_until && new Date(failure.blocked_until) > new Date() && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Blocked
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>IP: {failure.ip_address}</div>
                      <div>Reason: {failure.failure_reason}</div>
                      <div>Last Attempt: {formatTimestamp(failure.last_attempt_at)}</div>
                      {failure.blocked_until && (
                        <div>Blocked Until: {formatTimestamp(failure.blocked_until)}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}