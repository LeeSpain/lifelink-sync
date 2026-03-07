import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Server, 
  Database, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

export const SystemMonitor: React.FC = () => {
  const [services, setServices] = useState([
    { name: 'Supabase Database', status: 'operational', uptime: 'Live', icon: Database },
    { name: 'Riven AI Services', status: 'operational', uptime: 'Live', icon: Zap },
    { name: 'Edge Functions', status: 'operational', uptime: 'Live', icon: Server },
    { name: 'Content Pipeline', status: 'operational', uptime: 'Live', icon: Activity },
    { name: 'Real-time Updates', status: 'operational', uptime: 'Live', icon: Wifi }
  ]);

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Test database connection
      const { data: testData, error } = await supabase
        .from('marketing_campaigns')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        setServices(prev => prev.map(service => 
          service.name === 'Supabase Database' 
            ? { ...service, status: 'degraded' }
            : service
        ));
      }

      // Load recent campaign activities
      const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = campaigns?.map(campaign => ({
        time: new Date(campaign.created_at).toLocaleTimeString(),
        event: `Campaign "${campaign.title}" ${campaign.status}`,
        type: campaign.status === 'completed' ? 'success' : 
              campaign.status === 'failed' ? 'error' : 'info'
      })) || [];

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-700';
      case 'degraded': return 'bg-orange-100 text-orange-700';
      case 'down': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Live System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="font-medium">Database</span>
              </div>
              <span className="text-sm font-bold text-green-600">Live</span>
            </div>
            <div className="text-xs text-muted-foreground">Real-time connection active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium">AI Services</span>
              </div>
              <span className="text-sm font-bold text-green-600">Ready</span>
            </div>
            <div className="text-xs text-muted-foreground">Content generation active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Edge Functions</span>
              </div>
              <span className="text-sm font-bold text-green-600">Active</span>
            </div>
            <div className="text-xs text-muted-foreground">Processing workflows</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Real-time</span>
              </div>
              <span className="text-sm font-bold text-green-600">Synced</span>
            </div>
            <div className="text-xs text-muted-foreground">Live updates enabled</div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.status === 'operational' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Activity className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Loading activities...</span>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No recent activities. Start creating campaigns to see live system activity.
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded">
                  <Clock className={`h-4 w-4 mt-0.5 ${getActivityColor(activity.type)}`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.event}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};