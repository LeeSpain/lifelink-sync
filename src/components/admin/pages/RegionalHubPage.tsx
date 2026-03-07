import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, AlertTriangle, Shield, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RegionalHubPage = () => {
  const { t } = useTranslation();

  const { data: organizationsCount } = useQuery({
    queryKey: ['organizations-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' });

      if (error) throw error;
      return count || 0;
    }
  });

  const { data: usersCount } = useQuery({
    queryKey: ['regional-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organization_users')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    }
  });

  const { data: activeSosEvents } = useQuery({
    queryKey: ['active-sos-events'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('regional_sos_events')
        .select('*', { count: 'exact' })
        .eq('status', 'open');

      if (error) throw error;
      return count || 0;
    }
  });

  const { data: recentSosEvents } = useQuery({
    queryKey: ['recent-sos-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_sos_events')
        .select(`
          *,
          organizations (name, region)
        `)
        .order('triggered_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.regionalManagement')}</h1>
          <p className="text-muted-foreground">
            {t('admin.regionalManagementDescription')}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizationsCount}</div>
            <p className="text-xs text-muted-foreground">Regional call centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
            <p className="text-xs text-muted-foreground">Operators & supervisors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SOS</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeSosEvents}</div>
            <p className="text-xs text-muted-foreground">Open incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common regional management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/admin-dashboard/regional-organizations">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2">
                <Building className="h-8 w-8" />
                <span>Create Organization</span>
              </Button>
            </Link>
            <Link to="/admin-dashboard/regional-users">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2">
                <Users className="h-8 w-8" />
                <span>Invite Staff</span>
              </Button>
            </Link>
            <Link to="/regional-dashboard">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2">
                <Shield className="h-8 w-8" />
                <span>Regional Dashboard</span>
              </Button>
            </Link>
            <Link to="/admin-dashboard/regional-audit">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2">
                <AlertTriangle className="h-8 w-8" />
                <span>View Audit Log</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent SOS Events */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent SOS Events</CardTitle>
              <CardDescription>Latest emergency incidents across all regions</CardDescription>
            </div>
            <Link to="/admin-dashboard/emergencies">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSosEvents?.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">
                      {event.emergency_type || 'General Emergency'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.organizations?.name} - {event.organizations?.region}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getPriorityBadgeVariant(event.priority || 'medium')}>
                    {(event.priority || 'medium').toUpperCase()}
                  </Badge>
                  <Badge variant={event.status === 'open' ? 'destructive' : 'default'}>
                    {(event.status || 'open').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.triggered_at || '').toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {(!recentSosEvents || recentSosEvents.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No recent SOS events
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Management Links */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>Manage regional call centers</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin-dashboard/regional-organizations">
              <Button className="w-full">
                Manage Organizations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Management
            </CardTitle>
            <CardDescription>Invite and manage regional staff</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin-dashboard/regional-users">
              <Button className="w-full">
                Manage Staff
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit & Reports
            </CardTitle>
            <CardDescription>View activity logs and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin-dashboard/regional-audit">
              <Button className="w-full">
                View Audit Log
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegionalHubPage;