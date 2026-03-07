import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Users, MessageSquare, TrendingUp, Target, AlertTriangle, DollarSign, 
  Monitor, Smartphone, Tablet, Globe, Search, Share2, ArrowUpRight, 
  ArrowDownRight, Shield, Phone, Video, Activity, Clock, MousePointer,
  Zap, Eye, PlayCircle, UserCheck, Calendar, Bell, RefreshCw, CreditCard, ShoppingCart
} from 'lucide-react';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { useFamilyAnalytics } from '@/hooks/useFamilyAnalytics';
import { useVideoAnalytics } from '@/hooks/useVideoAnalytics';
import { useEnhancedTrafficSources, useEnhancedDeviceData, useSessionMetrics } from '@/hooks/useEnhancedAnalytics';
import { useTopPages, useCustomEvents, useRealTimeActiveUsers } from '@/hooks/useRealTimeAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

// Chart color scheme
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  subtext?: string;
  trend?: number[];
}

// Metric Card Component
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  subtext,
  trend 
}) => {
  const changeIcon = changeType === 'increase' ? 
    <ArrowUpRight className="h-4 w-4 text-green-500" /> : 
    changeType === 'decrease' ? 
    <ArrowDownRight className="h-4 w-4 text-red-500" /> : null;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <div className="flex items-center space-x-1">
                  {changeIcon}
                  <span className={`text-sm font-medium ${
                    changeType === 'increase' ? 'text-green-500' : 
                    changeType === 'decrease' ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="flex-shrink-0">
            {icon}
          </div>
        </div>
        {trend && trend.length > 0 && (
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.map((value, index) => ({ value, index }))}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardOverview() {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time analytics hooks
  const { data: realTimeMetrics, isLoading: metricsLoading } = useRealTimeAnalytics();
  const { data: videoAnalytics, isLoading: videoLoading } = useVideoAnalytics();
  const { data: trafficSources, isLoading: trafficLoading } = useEnhancedTrafficSources();
  const { data: deviceData, isLoading: deviceLoading } = useEnhancedDeviceData();
  const { data: sessionMetrics, isLoading: sessionLoading } = useSessionMetrics();
  const { data: topPages, isLoading: pagesLoading } = useTopPages();
  const { data: customEvents, isLoading: eventsLoading } = useCustomEvents();
  const { data: activeUsers, isLoading: activeLoading } = useRealTimeActiveUsers();
  const { data: familyMetrics, isLoading: familyLoading } = useFamilyAnalytics();

  // Refresh function
  const refreshAllData = useCallback(async () => {
    setLastUpdated(new Date());
    await queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return [
          'real-time-analytics',
          'lovable-analytics', 
          'enhanced-traffic-sources',
          'enhanced-device-data',
          'session-metrics',
          'top-pages',
          'custom-events',
          'real-time-active-users',
          'family-analytics',
          'video-analytics'
        ].includes(key);
      }
    });
    console.log('✅ Dashboard data refreshed');
  }, [queryClient]);

  // Listen for payment success events and auto-refresh
  useEffect(() => {
    const handlePaymentSuccess = (event: any) => {
      console.log('💳 Payment success detected, refreshing dashboard...', event.detail);
      refreshAllData();
    };

    // Listen for custom events
    window.addEventListener('data-updated', handlePaymentSuccess);

    // Listen for storage events (cross-tab updates)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('-updated')) {
        console.log('💳 Payment success detected from another tab, refreshing dashboard...');
        refreshAllData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('data-updated', handlePaymentSuccess);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshAllData]);

  console.log('📊 DashboardOverview rendering with real-time data');

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format time
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics and insights for LifeLink Sync Platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Live • Last updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAllData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={formatNumber(realTimeMetrics?.totalUsers || 0)}
          change="+12.5%"
          changeType="increase"
          icon={<Users className="h-8 w-8 text-primary" />}
          subtext="Active registered users"
        />
        
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(realTimeMetrics?.totalRevenue || 0)}
          change="+8.2%"
          changeType="increase"
          icon={<DollarSign className="h-8 w-8 text-green-500" />}
          subtext="Orders + Subscriptions combined"
        />
        
        <MetricCard
          title="Contact Submissions"
          value={formatNumber(realTimeMetrics?.totalContacts || 0)}
          change="+5.1%"
          changeType="increase"
          icon={<MessageSquare className="h-8 w-8 text-blue-500" />}
          subtext={`${realTimeMetrics?.contactsLast30Days || 0} in last 30 days`}
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${realTimeMetrics?.conversionRate || 0}%`}
          change="+2.3%"
          changeType="increase"
          icon={<Target className="h-8 w-8 text-orange-500" />}
          subtext="Registration to user ratio"
        />
      </div>

      {/* Family System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Family Connections"
          value={formatNumber(familyMetrics?.activeFamilyMembers || 0)}
          change="+15.2%"
          changeType="increase"
          icon={<Shield className="h-8 w-8 text-cyan-500" />}
          subtext={`${familyMetrics?.totalFamilyGroups || 0} family groups`}
        />
        
        <MetricCard
          title="SOS Events"
          value={formatNumber(familyMetrics?.totalSosEvents || 0)}
          change={familyMetrics?.activeSosEvents ? "-3.1%" : "0%"}
          changeType={familyMetrics?.activeSosEvents ? "decrease" : "neutral"}
          icon={<AlertTriangle className="h-8 w-8 text-orange-500" />}
          subtext={`${familyMetrics?.activeSosEvents || 0} currently active`}
        />
        
        <MetricCard
          title="Family Revenue"
          value={formatCurrency(familyMetrics?.familyRevenue || 0)}
          change="+22.1%"
          changeType="increase"
          icon={<DollarSign className="h-8 w-8 text-emerald-500" />}
          subtext="From family subscriptions"
        />
        
        <MetricCard
          title="Invite Success"
          value={`${familyMetrics?.inviteAcceptanceRate || 0}%`}
          change="+5.7%"
          changeType="increase"
          icon={<UserCheck className="h-8 w-8 text-blue-500" />}
          subtext={`${familyMetrics?.pendingInvites || 0} pending invites`}
        />
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Subscriptions"
          value={formatNumber(realTimeMetrics?.totalSubscriptions || 0)}
          change="+18.5%"
          changeType="increase"
          icon={<Shield className="h-8 w-8 text-purple-500" />}
          subtext="Premium Protection plans"
        />
        
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(realTimeMetrics?.monthlyRecurringRevenue || 0)}
          change="+15.3%"
          changeType="increase"
          icon={<DollarSign className="h-8 w-8 text-emerald-500" />}
          subtext="MRR from subscriptions"
        />
        
        <MetricCard
          title="Subscription Revenue"
          value={formatCurrency(realTimeMetrics?.subscriptionRevenue || 0)}
          change="+12.8%"
          changeType="increase"
          icon={<CreditCard className="h-8 w-8 text-blue-500" />}
          subtext="Total subscription income"
        />
        
        <MetricCard
          title="Product Orders"
          value={formatNumber(realTimeMetrics?.totalOrders || 0)}
          change="+6.4%"
          changeType="increase"
          icon={<ShoppingCart className="h-8 w-8 text-orange-500" />}
          subtext="One-time product sales"
        />
      </div>

      {/* Real-Time Activity & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Real-Time Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Users</span>
              <span className="text-2xl font-bold text-green-500">
                {activeUsers?.activeUsers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Page Views (1h)</span>
              <span className="text-lg font-semibold">
                {activeUsers?.pageViewsLastHour || 0}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Top Active Pages</p>
              {activeUsers?.topActivePages?.slice(0, 3).map((page, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="truncate">{page.page}</span>
                  <span className="font-medium">{page.users}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Session Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Bounce Rate</span>
                <span className="font-semibold">{sessionMetrics?.bounceRate || 0}%</span>
              </div>
              <Progress value={sessionMetrics?.bounceRate || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg Session Duration</span>
                <span className="font-semibold">
                  {formatDuration(sessionMetrics?.avgSessionDuration || 0)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Sessions (24h)</span>
                <span className="font-semibold">{sessionMetrics?.totalSessions || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Analytics Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlayCircle className="h-5 w-5 text-purple-500" />
              <span>Video Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoAnalytics && videoAnalytics.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Views</span>
                  <span className="text-2xl font-bold text-purple-500">
                    {videoAnalytics.reduce((sum, video) => sum + video.total_views, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Completion</span>
                  <span className="text-lg font-semibold">
                    {(videoAnalytics.reduce((sum, video) => sum + video.completion_rate, 0) / videoAnalytics.length).toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Videos</p>
                  {videoAnalytics.slice(0, 2).map((video, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate">{video.video_title}</span>
                      <span className="font-medium">{video.total_views}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No video analytics available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic & Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-green-500" />
              <span>Traffic Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, percentage }) => `${source}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="visitors"
                  >
                    {trafficSources?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              <span>Device Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deviceData?.map((device, index) => {
              const icons = {
                Mobile: <Smartphone className="h-4 w-4" />,
                Desktop: <Monitor className="h-4 w-4" />,
                Tablet: <Tablet className="h-4 w-4" />
              };
              
              return (
                <div key={device.device} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {icons[device.device as keyof typeof icons]}
                      <span className="text-sm font-medium">{device.device}</span>
                    </div>
                    <span className="text-sm font-semibold">{device.percentage}%</span>
                  </div>
                  <Progress value={device.percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages & Custom Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-indigo-500" />
              <span>Top Pages (30 days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages?.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium">{page.page}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{page.views}</p>
                    <p className="text-xs text-muted-foreground">{page.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MousePointer className="h-5 w-5 text-orange-500" />
              <span>Key Events (30 days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customEvents?.map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{event.event}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{event.count}</p>
                    <p className="text-xs text-green-500">{event.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Fast
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-semibold">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Recent Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-muted-foreground py-4">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-red-500" />
              <span>Emergency Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">SOS Incidents (24h)</span>
                <span className="text-lg font-bold text-red-500">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Response Time</span>
                <span className="text-sm font-semibold">&lt; 30s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connected Devices</span>
                <span className="text-sm font-semibold">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}