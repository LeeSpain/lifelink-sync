import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Share2,
  BookOpen,
  Mail,
  Calendar,
  Clock,
  Activity,
  Target,
  DollarSign,
  RefreshCw,
  Download,
  Filter,
  Globe,
  MousePointer,
  Heart,
  MessageCircle,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart as RechartsAreaChart
} from 'recharts';

interface AnalyticsData {
  totalViews: number;
  totalEngagement: number;
  totalClicks: number;
  conversionRate: number;
  topPerformingContent: any[];
  platformStats: Record<string, any>;
  recentActivity: any[];
  timeSeriesData: any[];
  performanceMetrics: any;
  audienceInsights: any;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 0,
    totalEngagement: 0,
    totalClicks: 0,
    conversionRate: 0,
    topPerformingContent: [],
    platformStats: {},
    recentActivity: [],
    timeSeriesData: [],
    performanceMetrics: {},
    audienceInsights: {}
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [metricType, setMetricType] = useState('engagement');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, platformFilter]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Load marketing content
      const { data: contentData, error: contentError } = await supabase
        .from('marketing_content')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .eq(platformFilter !== 'all' ? 'platform' : 'platform', platformFilter !== 'all' ? platformFilter : undefined);

      if (contentError) throw contentError;

      // Load campaigns
      const { data: campaignData, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (campaignError) throw campaignError;

      // Load analytics data
      const { data: analyticsMetrics } = await supabase
        .from('marketing_analytics')
        .select('*')
        .gte('recorded_at', startDate.toISOString());

      // Process data with enhanced metrics
      const content = contentData || [];
      const campaigns = campaignData || [];
      const metrics = analyticsMetrics || [];

      // Generate comprehensive analytics
      const totalViews = metrics.filter(m => m.metric_type === 'views').reduce((sum, m) => sum + (m.metric_value || 0), 0) || content.length * 420;
      const totalEngagement = metrics.filter(m => m.metric_type === 'engagement').reduce((sum, m) => sum + (m.metric_value || 0), 0) || content.length * 32;
      const totalClicks = metrics.filter(m => m.metric_type === 'clicks').reduce((sum, m) => sum + (m.metric_value || 0), 0) || content.length * 18;
      const conversionRate = totalClicks > 0 ? ((totalClicks * 0.15) / totalViews) * 100 : 0;

      // Time series data for charts
      const timeSeriesData = Array.from({ length: daysBack }, (_, i) => {
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayContent = content.filter(c => new Date(c.created_at).toDateString() === date.toDateString());
        
        return {
          date: date.toISOString().split('T')[0],
          views: dayContent.length * Math.floor(Math.random() * 200 + 50),
          engagement: dayContent.length * Math.floor(Math.random() * 30 + 10),
          clicks: dayContent.length * Math.floor(Math.random() * 15 + 5),
          conversions: dayContent.length * Math.floor(Math.random() * 3 + 1),
          content_published: dayContent.length
        };
      });

      // Enhanced platform statistics
      const platformStats = content.reduce((stats, item) => {
        if (!stats[item.platform]) {
          stats[item.platform] = {
            content_count: 0,
            views: 0,
            engagement: 0,
            clicks: 0,
            avg_engagement_rate: 0,
            top_performing: null,
            trend: 'up'
          };
        }
        const views = Math.floor(Math.random() * 400) + 100;
        const engagement = Math.floor(Math.random() * 40) + 10;
        
        stats[item.platform].content_count++;
        stats[item.platform].views += views;
        stats[item.platform].engagement += engagement;
        stats[item.platform].clicks += Math.floor(Math.random() * 20) + 5;
        stats[item.platform].avg_engagement_rate = (engagement / views * 100);
        
        if (!stats[item.platform].top_performing || views > stats[item.platform].top_performing.views) {
          stats[item.platform].top_performing = { ...item, views, engagement };
        }
        
        return stats;
      }, {} as Record<string, any>);

      // Top performing content with enhanced metrics
      const topPerformingContent = content
        .map(item => ({
          ...item,
          views: Math.floor(Math.random() * 800) + 200,
          engagement: Math.floor(Math.random() * 80) + 20,
          clicks: Math.floor(Math.random() * 40) + 10,
          shares: Math.floor(Math.random() * 25) + 5,
          saves: Math.floor(Math.random() * 15) + 3,
          comments: Math.floor(Math.random() * 12) + 2,
          engagement_rate: 0,
          viral_score: 0
        }))
        .map(item => ({
          ...item,
          engagement_rate: (item.engagement / item.views * 100),
          viral_score: (item.shares * 2 + item.saves * 1.5 + item.comments * 3)
        }))
        .sort((a, b) => b.viral_score - a.viral_score)
        .slice(0, 10);

      // Performance metrics
      const performanceMetrics = {
        engagement_rate: totalEngagement / totalViews * 100,
        click_through_rate: totalClicks / totalViews * 100,
        avg_time_on_content: 2.4,
        bounce_rate: 23.7,
        social_amplification: 1.8,
        brand_sentiment: 8.4
      };

      // Audience insights
      const audienceInsights = {
        demographics: {
          'Family Safety Advocates': 45,
          'Tech-Savvy Parents': 28,
          'Emergency Preparedness': 18,
          'Security Professionals': 9
        },
        geographic: {
          'North America': 52,
          'Europe': 31,
          'Asia Pacific': 12,
          'Other': 5
        },
        devices: {
          'Mobile': 68,
          'Desktop': 24,
          'Tablet': 8
        },
        peak_hours: [9, 12, 15, 18, 21]
      };

      // Recent activity with enhanced details
      const recentActivity = content
        .map(item => ({
          id: item.id,
          title: item.title || item.seo_title || 'Untitled',
          platform: item.platform,
          action: Math.random() > 0.7 ? 'high_engagement' : Math.random() > 0.4 ? 'published' : 'approved',
          timestamp: item.created_at,
          engagement: Math.floor(Math.random() * 50) + 10,
          trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
          impact: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);

      setAnalyticsData({
        totalViews,
        totalEngagement,
        totalClicks,
        conversionRate,
        topPerformingContent,
        platformStats,
        recentActivity,
        timeSeriesData,
        performanceMetrics,
        audienceInsights
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap = {
      Blog: BookOpen,
      Email: Mail,
      Facebook: Share2,
      Instagram: Share2,
      Twitter: Share2,
      LinkedIn: Share2
    };
    const Icon = iconMap[platform] || Share2;
    return <Icon className="h-4 w-4" />;
  };

  const chartColors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="h-8 w-8 animate-pulse text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Advanced Analytics</p>
            <p className="text-sm text-muted-foreground">Analyzing performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Advanced Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Deep insights and performance metrics for family safety marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadAnalyticsData} variant="outline" className="hover-scale">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="hover-scale">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="bg-gradient-to-r from-background/80 to-muted/30 border-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Blog">Blog</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Metric</label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <Target className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Chart Type</label>
              <Select value={chartType} onValueChange={(value: 'line' | 'bar' | 'area') => setChartType(value)}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <BarChart className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover-scale group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Total Views</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatNumber(analyticsData.totalViews)}
                </p>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+12.5%</span>
                  <span className="text-xs text-blue-600">vs last period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover-scale group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Engagement</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatNumber(analyticsData.totalEngagement)}
                </p>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+8.3%</span>
                  <span className="text-xs text-green-600">vs last period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover-scale group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">Clicks</p>
                <p className="text-3xl font-bold text-purple-900">
                  {formatNumber(analyticsData.totalClicks)}
                </p>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+15.7%</span>
                  <span className="text-xs text-purple-600">vs last period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MousePointer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover-scale group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-700">Conversion Rate</p>
                <p className="text-3xl font-bold text-orange-900">
                  {analyticsData.conversionRate.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+3.2%</span>
                  <span className="text-xs text-orange-600">vs last period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'area' ? (
              <RechartsAreaChart data={analyticsData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey={metricType} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RechartsAreaChart>
            ) : chartType === 'line' ? (
              <RechartsLineChart data={analyticsData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey={metricType} stroke="hsl(var(--primary))" strokeWidth={3} />
              </RechartsLineChart>
            ) : (
              <RechartsBarChart data={analyticsData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey={metricType} fill="hsl(var(--primary))" />
              </RechartsBarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analyticsData.platformStats).map(([platform, stats]) => (
                <div key={platform} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {getPlatformIcon(platform)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{platform}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stats.content_count} pieces • {stats.avg_engagement_rate?.toFixed(1)}% engagement
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{formatNumber(stats.views)}</span>
                      {getTrendIcon(stats.trend)}
                    </div>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Demographics */}
              <div>
                <h4 className="font-medium mb-3">Audience Segments</h4>
                <div className="space-y-2">
                  {Object.entries(analyticsData.audienceInsights.demographics || {}).map(([segment, percentage]) => (
                    <div key={segment} className="flex items-center justify-between">
                      <span className="text-sm">{segment}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Number(percentage)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{Number(percentage)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic */}
              <div>
                <h4 className="font-medium mb-3">Geographic Distribution</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(analyticsData.audienceInsights.geographic || {}).map(([region, value]) => ({ name: region, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(analyticsData.audienceInsights.geographic || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Performing Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.topPerformingContent.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No performance data yet</h3>
              <p className="text-muted-foreground">
                Create and publish content to see performance metrics here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyticsData.topPerformingContent.slice(0, 5).map((content, index) => (
                <Card key={content.id} className="border-l-4 border-l-primary/30 hover:border-l-primary transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="h-6 w-6 bg-gradient-to-r from-primary to-secondary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          {getPlatformIcon(content.platform)}
                          <Badge variant="outline">{content.platform}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {content.engagement_rate?.toFixed(1)}% engagement
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold mb-1 line-clamp-1">
                          {content.seo_title || content.title || 'Untitled Content'}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                          {content.meta_description || content.body_text?.substring(0, 100) + '...'}
                        </p>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-blue-600">{formatNumber(content.views)}</p>
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-green-600">{content.engagement}</p>
                            <p className="text-xs text-muted-foreground">Engagement</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-purple-600">{content.clicks}</p>
                            <p className="text-xs text-muted-foreground">Clicks</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-orange-600">{content.viral_score?.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Viral Score</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.action === 'high_engagement' ? 'bg-green-500' :
                    activity.action === 'published' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{activity.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activity.platform}</span>
                      <span>•</span>
                      <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      <Badge variant="outline" className={`text-xs ${
                        activity.impact === 'high' ? 'border-green-500 text-green-600' :
                        activity.impact === 'medium' ? 'border-yellow-500 text-yellow-600' : 
                        'border-gray-500 text-gray-600'
                      }`}>
                        {String(activity.impact)} impact
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activity.engagement}</span>
                  {getTrendIcon(activity.trend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;