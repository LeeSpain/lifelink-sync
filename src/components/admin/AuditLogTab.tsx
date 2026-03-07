import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Shield, User, Mail, Phone, MapPin, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogTabProps {
  userId: string;
}

export function AuditLogTab({ userId }: AuditLogTabProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="h-4 w-4" />;
    if (action.includes('email')) return <Mail className="h-4 w-4" />;
    if (action.includes('phone')) return <Phone className="h-4 w-4" />;
    if (action.includes('location')) return <MapPin className="h-4 w-4" />;
    if (action.includes('admin')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('failed') || action.includes('denied')) return 'destructive';
    if (action.includes('admin') || action.includes('role')) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Activity Audit Log</CardTitle>
        <CardDescription>
          Complete history of account actions and security events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!auditLogs || auditLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audit log entries found</p>
            <p className="text-sm mt-2">Security events will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionVariant(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.resource_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                    
                    {log.metadata && typeof log.metadata === 'object' && (
                      <div className="text-sm space-y-1">
                        {Object.entries(log.metadata as Record<string, any>).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {log.ip_address && (
                      <div className="text-xs text-muted-foreground">
                        IP: {log.ip_address.toString()}
                      </div>
                    )}
                    
                    {log.user_agent && (
                      <div className="text-xs text-muted-foreground truncate">
                        Agent: {log.user_agent}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
