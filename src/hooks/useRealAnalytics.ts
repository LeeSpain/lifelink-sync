import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RealAnalyticsData {
  totalReach: number;
  totalEngagement: number;
  totalClicks: number;
  campaignMetrics: Array<{
    campaignId: string;
    reach: number;
    engagement: number;
    clicks: number;
    platform: string;
  }>;
  platformPerformance: Array<{
    platform: string;
    totalPosts: number;
    totalReach: number;
    averageEngagement: number;
  }>;
}

export function useRealAnalytics() {
  return useQuery({
    queryKey: ['real-analytics'],
    queryFn: async (): Promise<RealAnalyticsData> => {
      // Fetch real analytics from marketing_analytics table
      const { data: analytics, error } = await supabase
        .from('marketing_analytics')
        .select(`
          *,
          marketing_content!inner(platform, campaign_id),
          marketing_campaigns!inner(title)
        `);

      if (error) {
        console.error('Error fetching analytics:', error);
        return {
          totalReach: 0,
          totalEngagement: 0, 
          totalClicks: 0,
          campaignMetrics: [],
          platformPerformance: []
        };
      }

      // Process real analytics data
      const processedData = analytics?.reduce((acc, item) => {
        switch (item.metric_type) {
          case 'reach':
            acc.totalReach += Number(item.metric_value) || 0;
            break;
          case 'engagement':
            acc.totalEngagement += Number(item.metric_value) || 0;
            break;
          case 'clicks':
            acc.totalClicks += Number(item.metric_value) || 0;
            break;
        }
        return acc;
      }, {
        totalReach: 0,
        totalEngagement: 0,
        totalClicks: 0
      }) || { totalReach: 0, totalEngagement: 0, totalClicks: 0 };

      // Group by campaign
      const campaignMetrics = analytics?.reduce((acc: any[], item) => {
        const existing = acc.find(c => c.campaignId === item.campaign_id);
        if (existing) {
          if (item.metric_type === 'reach') existing.reach += Number(item.metric_value) || 0;
          if (item.metric_type === 'engagement') existing.engagement += Number(item.metric_value) || 0;
          if (item.metric_type === 'clicks') existing.clicks += Number(item.metric_value) || 0;
        } else {
          acc.push({
            campaignId: item.campaign_id,
            reach: item.metric_type === 'reach' ? Number(item.metric_value) || 0 : 0,
            engagement: item.metric_type === 'engagement' ? Number(item.metric_value) || 0 : 0,
            clicks: item.metric_type === 'clicks' ? Number(item.metric_value) || 0 : 0,
            platform: item.platform
          });
        }
        return acc;
      }, []) || [];

      // Group by platform
      const platformPerformance = analytics?.reduce((acc: any[], item) => {
        const existing = acc.find(p => p.platform === item.platform);
        if (existing) {
          existing.totalPosts += 1;
          if (item.metric_type === 'reach') existing.totalReach += Number(item.metric_value) || 0;
          if (item.metric_type === 'engagement') existing.averageEngagement += Number(item.metric_value) || 0;
        } else {
          acc.push({
            platform: item.platform,
            totalPosts: 1,
            totalReach: item.metric_type === 'reach' ? Number(item.metric_value) || 0 : 0,
            averageEngagement: item.metric_type === 'engagement' ? Number(item.metric_value) || 0 : 0
          });
        }
        return acc;
      }, []) || [];

      return {
        ...processedData,
        campaignMetrics,
        platformPerformance
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });
}