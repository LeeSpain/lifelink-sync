import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Target,
  Calendar,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';

interface AnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalReach: number;
  totalEngagement: number;
  totalClicks: number;
  averageEngagementRate: number;
  topPerformingPlatform: string;
  recentCampaigns: CampaignAnalytics[];
}

interface CampaignAnalytics {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  totalContent: number;
  publishedContent: number;
  reach: number;
  engagement: number;
  clicks: number;
  engagementRate: number;
  platforms: string[];
  budget: number;
  costPerClick: number;
}

interface CampaignAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignAnalyticsDashboard: React.FC<CampaignAnalyticsDashboardProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Load content and analytics
      const { data: content, error: contentError } = await supabase
        .from('marketing_content')
        .select('*');

      if (contentError) throw contentError;

      // Load analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('marketing_analytics')
        .select('*')
        .gte('recorded_at', getDateRange(selectedTimeRange));

      if (analyticsError) throw analyticsError;

      // Process and calculate metrics
      const processedData = processAnalyticsData(campaigns || [], content || [], analytics || []);
      setAnalyticsData(processedData);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const processAnalyticsData = (campaigns: any[], content: any[], analytics: any[]): AnalyticsData => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
    
    // Calculate totals from analytics
    const totalReach = analytics
      .filter(a => a.metric_type === 'reach')
      .reduce((sum, a) => sum + (a.metric_value || 0), 0);
    
    const totalEngagement = analytics
      .filter(a => a.metric_type === 'engagement')
      .reduce((sum, a) => sum + (a.metric_value || 0), 0);
    
    const totalClicks = analytics
      .filter(a => a.metric_type === 'clicks')
      .reduce((sum, a) => sum + (a.metric_value || 0), 0);

    const averageEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    // Find top performing platform
    const platformMetrics = analytics.reduce((acc, a) => {
      if (!acc[a.platform]) acc[a.platform] = 0;
      acc[a.platform] += a.metric_value || 0;
      return acc;
    }, {} as Record<string, number>);
    
    const topPerformingPlatform = Object.keys(platformMetrics).reduce((a, b) => 
      platformMetrics[a] > platformMetrics[b] ? a : b, 'N/A'
    );

    // Process recent campaigns
    const recentCampaigns: CampaignAnalytics[] = campaigns.slice(0, 10).map(campaign => {
      const campaignContent = content.filter(c => c.campaign_id === campaign.id);
      const campaignAnalytics = analytics.filter(a => a.campaign_id === campaign.id);
      
      const reach = campaignAnalytics
        .filter(a => a.metric_type === 'reach')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);
      
      const engagement = campaignAnalytics
        .filter(a => a.metric_type === 'engagement')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);
      
      const clicks = campaignAnalytics
        .filter(a => a.metric_type === 'clicks')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);

      return {
        id: campaign.id,
        name: campaign.title || 'Untitled Campaign',
        status: campaign.status,
        startDate: campaign.created_at,
        endDate: campaign.completed_at,
        totalContent: campaignContent.length,
        publishedContent: campaignContent.filter(c => c.status === 'published').length,
        reach,
        engagement,
        clicks,
        engagementRate: reach > 0 ? (engagement / reach) * 100 : 0,
        platforms: [...new Set(campaignContent.map(c => c.platform))],
        budget: campaign.budget_estimate || 0,
        costPerClick: clicks > 0 ? (campaign.budget_estimate || 0) / clicks : 0
      };
    });

    return {
      totalCampaigns,
      activeCampaigns,
      totalReach,
      totalEngagement,
      totalClicks,
      averageEngagementRate,
      topPerformingPlatform,
      recentCampaigns
    };
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      ['Campaign', 'Status', 'Reach', 'Engagement', 'Clicks', 'Engagement Rate', 'Cost per Click'],
      ...analyticsData.recentCampaigns.map(campaign => [
        campaign.name,
        campaign.status,
        campaign.reach.toString(),
        campaign.engagement.toString(),
        campaign.clicks.toString(),
        campaign.engagementRate.toFixed(2) + '%',
        '$' + campaign.costPerClick.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riven-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] w-full m-4 overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Campaign Analytics Dashboard
            </h2>
            <div className="flex gap-2">
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button
                variant="outline"
                onClick={exportAnalytics}
                disabled={!analyticsData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={loadAnalyticsData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {analyticsData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{analyticsData.totalCampaigns}</div>
                    <div className="text-sm text-muted-foreground">Total Campaigns</div>
                    <div className="text-xs text-green-600">
                      {analyticsData.activeCampaigns} active
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{analyticsData.totalReach.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Reach</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold">{analyticsData.totalEngagement.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Engagement</div>
                    <div className="text-xs text-blue-600">
                      {analyticsData.averageEngagementRate.toFixed(1)}% rate
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{analyticsData.totalClicks.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                    <div className="text-xs text-purple-600">
                      Top: {analyticsData.topPerformingPlatform}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Campaign Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Campaign</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-right p-2">Content</th>
                          <th className="text-right p-2">Reach</th>
                          <th className="text-right p-2">Engagement</th>
                          <th className="text-right p-2">Clicks</th>
                          <th className="text-right p-2">Eng. Rate</th>
                          <th className="text-right p-2">CPC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.recentCampaigns.map((campaign) => (
                          <tr key={campaign.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{campaign.name}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(campaign.startDate).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge 
                                variant={campaign.status === 'running' ? 'default' : 'secondary'}
                              >
                                {campaign.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">
                              <div>{campaign.publishedContent}/{campaign.totalContent}</div>
                              <Progress 
                                value={(campaign.publishedContent / campaign.totalContent) * 100} 
                                className="h-1 mt-1"
                              />
                            </td>
                            <td className="p-2 text-right">{campaign.reach.toLocaleString()}</td>
                            <td className="p-2 text-right">{campaign.engagement.toLocaleString()}</td>
                            <td className="p-2 text-right">{campaign.clicks.toLocaleString()}</td>
                            <td className="p-2 text-right">{campaign.engagementRate.toFixed(1)}%</td>
                            <td className="p-2 text-right">${campaign.costPerClick.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading analytics data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};