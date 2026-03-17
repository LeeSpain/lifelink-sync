import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Eye, 
  Clock, 
  Users, 
  Globe, 
  BarChart3,
  RefreshCw,
  Video,
  TrendingUp,
  MapPin,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useVideoAnalytics, useVideoEvents, useVideoKpis24h } from '@/hooks/useVideoAnalytics';
import AdminErrorBoundary from '@/components/AdminErrorBoundary';

const VideoAnalyticsPage = () => {
  const { data: videoAnalytics, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useVideoAnalytics();
  const { data: recentEvents, isLoading: isLoadingEvents, refetch: refetchEvents } = useVideoEvents(100);
  const { data: kpis24h, refetch: refetchKpis } = useVideoKpis24h();

  const isLoading = isLoadingAnalytics || isLoadingEvents;

  const refreshAllData = async () => {
    await Promise.all([refetchAnalytics(), refetchEvents(), refetchKpis()]);
  };

  // Calculate totals
  const totalViews = videoAnalytics?.reduce((sum, video) => sum + video.total_views, 0) || 0;
  const totalWatchTime = videoAnalytics?.reduce((sum, video) => sum + video.total_watch_time_minutes, 0) || 0;
  const avgCompletionRate = videoAnalytics?.length ? 
    videoAnalytics.reduce((sum, video) => sum + video.completion_rate, 0) / videoAnalytics.length : 0;
  const totalUniqueViewers = videoAnalytics?.reduce((sum, video) => sum + video.unique_viewers, 0) || 0;

  const lastEventAt = recentEvents && recentEvents.length > 0 ? new Date(recentEvents[0].created_at).toLocaleTimeString() : '—';

  // Get device breakdown from recent events
  const deviceBreakdown = recentEvents?.reduce((acc, event) => {
    acc[event.device_type] = (acc[event.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get top countries
  const countryStats = videoAnalytics?.reduce((acc, video) => {
    video.top_countries?.forEach((country) => {
      if (country.country) {
        acc[country.country] = (acc[country.country] || 0) + country.count;
      }
    });
    return acc;
  }, {} as Record<string, number>) || {};

  const topCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    format = 'number',
    change 
  }: {
    title: string;
    value: number;
    icon: any;
    format?: 'number' | 'percentage' | 'duration';
    change?: number;
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${val.toFixed(1)}%`;
        case 'duration':
          return `${Math.floor(val / 60)}h ${Math.floor(val % 60)}m`;
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
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Video Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive video engagement analytics for all LifeLink Sync videos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="text-xs">Live</Badge>
            <Badge variant="outline" className="text-xs">Last event: {lastEventAt}</Badge>
            <Badge variant="outline" className="text-xs">
              {videoAnalytics?.length || 0} videos tracked
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Video Views"
            value={totalViews}
            icon={Play}
          />
          <MetricCard
            title="Total Watch Time"
            value={totalWatchTime}
            icon={Clock}
            format="duration"
          />
          <MetricCard
            title="Avg Completion Rate"
            value={avgCompletionRate}
            icon={TrendingUp}
            format="percentage"
          />
          <MetricCard
            title="Unique Viewers"
            value={totalUniqueViewers}
            icon={Users}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Individual Videos</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Video views by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(deviceBreakdown).map(([device, count]) => {
                      const Icon = device === 'mobile' ? Smartphone : 
                                  device === 'tablet' ? Tablet : Monitor;
                      const percentage = totalViews > 0 ? (count / totalViews * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={device} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium capitalize">{device}</p>
                              <p className="text-sm text-muted-foreground">{count} views</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{percentage}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Countries */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                  <CardDescription>Video views by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCountries.length > 0 ? (
                      topCountries.map(([country, count]) => {
                        const percentage = totalViews > 0 ? (count / totalViews * 100).toFixed(1) : '0';
                        
                        return (
                          <div key={country} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{country}</p>
                                <p className="text-sm text-muted-foreground">{count} views</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No location data available yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="grid gap-4">
              {videoAnalytics && videoAnalytics.length > 0 ? (
                videoAnalytics.map((video) => (
                  <Card key={video.video_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{video.video_title}</CardTitle>
                          <CardDescription>ID: {video.video_id}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {video.total_views} views
                          </Badge>
                          <Badge 
                            variant={video.completion_rate > 70 ? "default" : "secondary"}
                          >
                            {video.completion_rate.toFixed(1)}% completion
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Watch Time</p>
                          <p className="text-sm font-medium">
                            {Math.floor(video.total_watch_time_minutes / 60)}h {Math.floor(video.total_watch_time_minutes % 60)}m
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Avg Watch Time</p>
                          <p className="text-sm font-medium">
                            {video.avg_watch_time_minutes.toFixed(1)} min
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Unique Viewers</p>
                          <p className="text-sm font-medium">{video.unique_viewers}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Engagement</p>
                          <p className="text-sm font-medium">
                            {video.total_views > 0 ? 
                              (video.unique_viewers / video.total_views * 100).toFixed(1) : '0'}% unique
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No video analytics data available yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Video analytics will appear here once users start watching videos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Audience Overview</CardTitle>
                  <CardDescription>Key audience metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Unique Viewers</span>
                      <span className="font-medium">{totalUniqueViewers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Sessions per Viewer</span>
                      <span className="font-medium">
                        {totalUniqueViewers > 0 ? (totalViews / totalUniqueViewers).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Watch Time per Session</span>
                      <span className="font-medium">
                        {totalViews > 0 ? (totalWatchTime / totalViews).toFixed(1) : '0'} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Viewers by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topCountries.length > 0 ? (
                      topCountries.map(([country, count], index) => (
                        <div key={country} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span className="text-sm">{country}</span>
                          </div>
                          <span className="text-sm font-medium">{count} viewers</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No geographic data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Video Events</CardTitle>
                <CardDescription>Latest video interactions and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <p className="text-sm text-muted-foreground">Loading recent events...</p>
                ) : recentEvents && recentEvents.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentEvents.slice(0, 20).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            event.event_type === 'play' ? 'bg-green-500' :
                            event.event_type === 'pause' ? 'bg-yellow-500' :
                            event.event_type === 'ended' ? 'bg-blue-500' :
                            event.event_type === 'seek' ? 'bg-purple-500' : 'bg-gray-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{event.video_title}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span className="capitalize">{event.event_type}</span>
                              <span>•</span>
                              <span>{event.device_type}</span>
                              <span>•</span>
                              <span>{event.browser}</span>
                              {event.user_location?.country && (
                                <>
                                  <span>•</span>
                                  <span>{event.user_location.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                          {event.watch_duration_seconds > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(event.watch_duration_seconds / 60)}:{(event.watch_duration_seconds % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No video events recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminErrorBoundary>
  );
};

export default VideoAnalyticsPage;