import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Monitor,
  RefreshCw,
  Calendar,
  DollarSign,
  Activity,
  UserPlus,
  Mail,
  ShoppingCart
} from 'lucide-react';
import { 
  useRealTimeAnalytics, 
  useLovableAnalytics, 
  useTopPages, 
  useCustomEvents, 
  useRealTimeActiveUsers,
  type RealTimeMetrics
} from '@/hooks/useRealTimeAnalytics';
import { useContactAnalytics } from '@/hooks/useContactAnalytics';
import { 
  useEnhancedTrafficSources, 
  useEnhancedDeviceData,
  useSessionMetrics,
  type TrafficSource,
  type DeviceData 
} from '@/hooks/useEnhancedAnalytics';
import { 
  useGeographicAnalytics,
  usePopupAnalytics,
  useInteractionAnalytics,
  useHourlyAnalytics
} from '@/hooks/useAdvancedAnalytics';
import { GeographicAnalyticsCard } from '@/components/admin/analytics/GeographicAnalyticsCard';
import { PopupAnalyticsCard } from '@/components/admin/analytics/PopupAnalyticsCard';
import { HourlyAnalyticsChart } from '@/components/admin/analytics/HourlyAnalyticsChart';
import { InteractionAnalyticsCard } from '@/components/admin/analytics/InteractionAnalyticsCard';
import { ContactAnalyticsCard } from '@/components/admin/analytics/ContactAnalyticsCard';
import { AnalyticsHealthCheck } from '@/components/admin/analytics/AnalyticsHealthCheck';
import AdminErrorBoundary from '@/components/AdminErrorBoundary';

const AnalyticsPage = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState('30d');
  const queryClient = useQueryClient();

  // Enable real-time updates with proper refresh intervals
  useEffect(() => {
    console.log('🔄 ANALYTICS DASHBOARD: Real-time updates ENABLED');
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      setLastUpdated(new Date());
      console.log('🔄 Auto-refresh triggered');
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Stable initialization 
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🔄 ANALYTICS DASHBOARD: Initialized successfully');
      isInitialized.current = true;
    }
  }, []);
  // Real-time data hooks - stable loading without loops
  const { data: realTimeData, isLoading: isRealTimeLoading, error: realTimeError } = useRealTimeAnalytics();
  const { data: lovableData, isLoading: isLovableLoading, error: lovableError } = useLovableAnalytics();
  const { data: trafficSources, isLoading: isTrafficLoading, error: trafficError } = useEnhancedTrafficSources();
  const { data: deviceData, isLoading: isDeviceLoading, error: deviceError } = useEnhancedDeviceData();
  const { data: sessionMetrics, isLoading: isSessionLoading, error: sessionError } = useSessionMetrics();
  const { data: geographicData, isLoading: isGeographicLoading, error: geographicError } = useGeographicAnalytics(timeRange);
  const { data: popupData, isLoading: isPopupLoading, error: popupError } = usePopupAnalytics(timeRange);
  const { data: interactionData, isLoading: isInteractionLoading, error: interactionError } = useInteractionAnalytics(timeRange);
  const { data: hourlyData, isLoading: isHourlyLoading, error: hourlyError } = useHourlyAnalytics();
  const { data: topPages, isLoading: isTopPagesLoading, error: topPagesError } = useTopPages();
  const { data: customEvents, isLoading: isCustomEventsLoading, error: customEventsError } = useCustomEvents();
  const { data: activeUsers, isLoading: isActiveUsersLoading, error: activeUsersError } = useRealTimeActiveUsers();
  const { data: contactData, isLoading: isContactLoading, error: contactError } = useContactAnalytics();

  const isLoading = isRealTimeLoading || isLovableLoading || isTrafficLoading || isDeviceLoading || isSessionLoading || isGeographicLoading || isPopupLoading || isInteractionLoading || isHourlyLoading || isTopPagesLoading || isCustomEventsLoading || isActiveUsersLoading || isContactLoading;

  // Enhanced refresh function - invalidate all analytics queries
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
          'geographic-analytics',
          'popup-analytics',
          'interaction-analytics',
          'hourly-analytics',
          'top-pages',
          'custom-events',
          'real-time-active-users',
          'family-analytics',
          'contact-analytics'
        ].includes(key);
      }
    });
    console.log('✅ All analytics data refreshed');
  }, []);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    format?: 'number' | 'percentage' | 'currency' | 'duration';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${val}%`;
        case 'currency':
          return `€${val.toLocaleString()}`;
        case 'duration':
          return `${Math.floor(val / 60)}m ${val % 60}s`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {change !== undefined && (
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {' '}from last month
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminErrorBoundary>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Monitor your LifeLink Sync platform performance and user engagement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Page Views"
          value={lovableData?.pageViews || 0}
          icon={Eye}
        />
        <MetricCard
          title="Unique Visitors"
          value={lovableData?.uniqueVisitors || 0}
          icon={Users}
        />
        <MetricCard
          title="Total Users"
          value={realTimeData?.totalUsers || 0}
          icon={UserPlus}
        />
        <MetricCard
          title="Contacts (30d)"
          value={contactData?.contactsLast30Days || 0}
          icon={Mail}
        />
        <MetricCard
          title="Conversion Rate"
          value={realTimeData?.conversionRate || 0}
          icon={TrendingUp}
          format="percentage"
        />
        <MetricCard
          title="Revenue"
          value={realTimeData?.totalRevenue || 0}
          icon={DollarSign}
          format="currency"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="health" className="text-xs sm:text-sm">Health</TabsTrigger>
            <TabsTrigger value="pages" className="text-xs sm:text-sm">Pages</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs sm:text-sm">Contacts</TabsTrigger>
            <TabsTrigger value="geographic" className="text-xs sm:text-sm">Geographic</TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs sm:text-sm">Traffic</TabsTrigger>
            <TabsTrigger value="devices" className="text-xs sm:text-sm">Devices</TabsTrigger>
            <TabsTrigger value="popups" className="text-xs sm:text-sm">Popups</TabsTrigger>
            <TabsTrigger value="hourly" className="text-xs sm:text-sm">24-Hour</TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm">Events</TabsTrigger>
            <TabsTrigger value="journeys" className="text-xs sm:text-sm">Journeys</TabsTrigger>
            <TabsTrigger value="real-time" className="text-xs sm:text-sm">Live</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="health" className="space-y-4">
          <AnalyticsHealthCheck />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Bounce Rate"
              value={sessionMetrics?.bounceRate || 0}
              icon={MousePointer}
              format="percentage"
            />
            <MetricCard
              title="Avg. Session Duration"
              value={sessionMetrics?.avgSessionDuration || 0}
              icon={Activity}
              format="duration"
            />
            <MetricCard
              title="Sessions"
              value={lovableData?.sessions || 0}
              icon={Calendar}
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total Contacts"
              value={contactData?.totalContacts || 0}
              icon={Mail}
            />
            <MetricCard
              title="Completed Orders"
              value={realTimeData?.totalOrders || 0}
              icon={ShoppingCart}
            />
            <MetricCard
              title="Registrations"
              value={realTimeData?.totalRegistrations || 0}
              icon={UserPlus}
            />
          </div>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isTopPagesLoading ? (
                <p className="text-sm text-muted-foreground">Loading page data...</p>
              ) : topPages && topPages.length > 0 ? (
                <div className="space-y-4">
                  {topPages.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.page}</p>
                        <p className="text-sm text-muted-foreground">{item.views.toLocaleString()} views</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No page view data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Performance</CardTitle>
              <CardDescription>Detailed analytics for each page</CardDescription>
            </CardHeader>
            <CardContent>
              {isTopPagesLoading ? (
                <p className="text-sm text-muted-foreground">Loading page analytics...</p>
              ) : topPages && topPages.length > 0 ? (
                <div className="space-y-4">
                  {topPages.map((page, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{page.page}</h4>
                        <Badge variant="outline">{page.views} views</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Views</p>
                          <p className="font-medium">{page.views}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Percentage</p>
                          <p className="font-medium">{page.percentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No page analytics data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <ContactAnalyticsCard />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <GeographicAnalyticsCard 
            timeRange={timeRange} 
            onTimeRangeChange={setTimeRange} 
          />
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              {isTrafficLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-8 bg-muted rounded animate-pulse mb-1" />
                        <div className="w-16 h-2 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {trafficSources?.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{source.source}</p>
                        <p className="text-sm text-muted-foreground">{source.visitors.toLocaleString()} visitors</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{source.percentage}%</p>
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Sessions by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {isDeviceLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {deviceData?.map((device, index) => {
                    const Icon = device.device === 'Mobile' ? Smartphone : 
                                device.device === 'Desktop' ? Monitor : 
                                Globe;
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{device.device}</p>
                            <p className="text-sm text-muted-foreground">{device.sessions.toLocaleString()} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{device.percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popups" className="space-y-4">
          <PopupAnalyticsCard timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <HourlyAnalyticsChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <InteractionAnalyticsCard timeRange={timeRange} />
            <Card>
              <CardHeader>
                <CardTitle>Custom Events</CardTitle>
                <CardDescription>LifeLink Sync specific event tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {isCustomEventsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading event data...</p>
                ) : customEvents && customEvents.length > 0 ? (
                  <div className="space-y-4">
                    {customEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{event.event}</p>
                          <p className="text-sm text-muted-foreground">{event.count} events</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {event.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom event data available yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Journey Analysis</CardTitle>
              <CardDescription>Common paths users take through your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">User journey analytics will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="real-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Overview</CardTitle>
              <CardDescription>Live visitors and activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isActiveUsersLoading ? (
                <p className="text-sm text-muted-foreground">Loading real-time data...</p>
              ) : (
                <>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold text-emerald-600">{activeUsers?.activeUsers || 0}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Page Views (last hour)</p>
                      <p className="text-2xl font-bold">{activeUsers?.pageViewsLastHour || 0}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <p className="text-sm font-medium">Top Active Pages</p>
                    <div className="space-y-2">
                      {activeUsers?.topActivePages?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.page}</span>
                          <span className="font-medium">{item.users} users</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </AdminErrorBoundary>
  );
};

export default AnalyticsPage;