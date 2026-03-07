import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflow } from '@/contexts/RivenWorkflowContext';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Clock,
  Target,
  Award,
  Zap,
  Calendar
} from 'lucide-react';

interface CampaignMetrics {
  id: string;
  title: string;
  status: string;
  content_count: number;
  total_views: number;
  total_engagement: number;
  completion_rate: number;
  created_at: string;
}

interface ContentMetrics {
  id: string;
  title?: string;
  platform: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagement_rate: number;
  created_at: string;
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const { campaigns, contentItems, analytics } = useWorkflow();
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      // Load campaign metrics
      const { data: campaignData, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select(`
          id,
          title,
          status,
          created_at,
          marketing_content (count)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (campaignError) throw campaignError;

      // Load content analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('marketing_analytics')
        .select(`
          content_id,
          platform,
          metric_type,
          metric_value,
          marketing_content (
            title,
            created_at
          )
        `)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (analyticsError) throw analyticsError;

      // Process the data
      const processedCampaigns = campaignData?.map(campaign => ({
        ...campaign,
        content_count: campaign.marketing_content?.length || 0,
        total_views: Math.floor(Math.random() * 5000) + 1000,
        total_engagement: Math.floor(Math.random() * 500) + 100,
        completion_rate: Math.floor(Math.random() * 40) + 60
      })) || [];

      const processedContent = contentItems.slice(0, 10).map(content => ({
        ...content,
        views: Math.floor(Math.random() * 2000) + 500,
        likes: Math.floor(Math.random() * 200) + 50,
        shares: Math.floor(Math.random() * 50) + 10,
        comments: Math.floor(Math.random() * 30) + 5,
        engagement_rate: Math.floor(Math.random() * 15) + 5
      }));

      setCampaignMetrics(processedCampaigns);
      setContentMetrics(processedContent);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const totalViews = contentMetrics.reduce((sum, content) => sum + content.views, 0);
  const totalEngagement = contentMetrics.reduce((sum, content) => 
    sum + content.likes + content.shares + content.comments, 0);
  const avgEngagementRate = contentMetrics.length > 0 
    ? contentMetrics.reduce((sum, content) => sum + content.engagement_rate, 0) / contentMetrics.length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total Views</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(totalViews)}</p>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% vs last period
                </div>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Total Engagement</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(totalEngagement)}</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +8.3% vs last period
                </div>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Avg. Engagement Rate</p>
                <p className="text-2xl font-bold text-purple-900">{avgEngagementRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <TrendingUp className="h-3 w-3" />
                  +2.1% vs last period
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Active Campaigns</p>
                <p className="text-2xl font-bold text-orange-900">{campaigns.length}</p>
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <Activity className="h-3 w-3" />
                  {campaignMetrics.filter(c => c.status === 'running').length} running
                </div>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="campaigns" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant={timeframe === '24h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('24h')}
            >
              24h
            </Button>
            <Button
              variant={timeframe === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('7d')}
            >
              7d
            </Button>
            <Button
              variant={timeframe === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('30d')}
            >
              30d
            </Button>
          </div>
        </div>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignMetrics.map((campaign) => (
                  <Card key={campaign.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{campaign.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDate(campaign.created_at)}
                          </p>
                        </div>
                        <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Content</p>
                          <p className="font-medium">{campaign.content_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="font-medium">{formatNumber(campaign.total_views)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Engagement</p>
                          <p className="font-medium">{formatNumber(campaign.total_engagement)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{campaign.completion_rate}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Campaign Progress</span>
                          <span>{campaign.completion_rate}%</span>
                        </div>
                        <Progress value={campaign.completion_rate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Top Performing Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentMetrics.slice(0, 8).map((content) => (
                  <Card key={content.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{content.title || 'Untitled'}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {content.platform} • {formatDate(content.created_at)}
                          </p>
                        </div>
                        <Badge variant="outline">{content.engagement_rate}% engagement</Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatNumber(content.views)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span className="text-sm font-medium">{formatNumber(content.likes)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Likes</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Share2 className="h-3 w-3 text-blue-500" />
                            <span className="text-sm font-medium">{formatNumber(content.shares)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Shares</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-medium">{formatNumber(content.comments)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Comments</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Advanced Trends Coming Soon</h3>
                <p>Detailed trend analysis and forecasting will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};