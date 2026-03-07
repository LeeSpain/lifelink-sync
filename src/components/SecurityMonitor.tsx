import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Clock } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
}

export const SecurityMonitor = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSecurityEvents();
    }
  }, [user]);

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeAllGmailTokens = async () => {
    try {
      const { error } = await supabase.functions.invoke('gmail-token-security', {
        body: { action: 'revoke_all' }
      });

      if (error) throw error;
      
      // Refresh security events
      await fetchSecurityEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    return null;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'token_access':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Monitor</span>
        </CardTitle>
        <CardDescription>
          Recent security events for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Recent Activity</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={revokeAllGmailTokens}
            className="text-red-600 hover:text-red-700"
          >
            Revoke All Gmail Access
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No security events recorded
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getEventIcon(event.event_type)}
                  <div>
                    <p className="text-sm font-medium">
                      {event.event_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventTime(event.created_at)}
                    </p>
                  </div>
                </div>
                {event.ip_address && (
                  <p className="text-xs text-muted-foreground">
                    IP: {event.ip_address}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your account is protected by advanced security monitoring</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};