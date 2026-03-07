import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Database, Users, Search, Calendar } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  organization_id: string;
  action: string;
  target_table: string;
  target_id: string;
  changes: any;
  created_at: string;
  organizations: {
    name: string;
    region: string;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

const RegionalAuditPage = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: organizations } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, region')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', selectedOrg, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('regional_audit_log')
        .select(`
          *,
          organizations (
            name,
            region
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedOrg !== 'all') {
        query = query.eq('organization_id', selectedOrg);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    }
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'default';
    if (action.includes('update') || action.includes('modify')) return 'secondary';
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    return 'outline';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user') || action.includes('operator')) return <Users className="h-3 w-3" />;
    if (action.includes('sos') || action.includes('emergency')) return <Shield className="h-3 w-3" />;
    return <Database className="h-3 w-3" />;
  };

  const filteredLogs = auditLogs?.filter(log => 
    !searchTerm || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueActions = [...new Set(auditLogs?.map(log => log.action) || [])];

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Regional Audit Log</h1>
        <p className="text-muted-foreground">
          Track all actions performed within regional organizations
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions, tables, or organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Activity Log
          </CardTitle>
          <CardDescription>
            Comprehensive audit trail of all regional system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionIcon(log.action)}
                        <span className="ml-1">{log.action}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.profiles?.first_name} {log.profiles?.last_name}
                        <div className="text-muted-foreground">
                          {log.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.organizations?.name}</div>
                        <div className="text-muted-foreground">{log.organizations?.region}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.target_table}</div>
                        <div className="text-muted-foreground">
                          ID: {log.target_id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px]">
                        {log.changes && typeof log.changes === 'object' ? (
                          <div className="space-y-1">
                            {Object.entries(log.changes).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-muted-foreground">
                                  {typeof value === 'string' ? value : JSON.stringify(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No details</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredLogs?.length === 0 && (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                <p className="text-muted-foreground">
                  No activity logs match your current filters.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalAuditPage;