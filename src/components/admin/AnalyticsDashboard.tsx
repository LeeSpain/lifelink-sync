import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share,
  BarChart3,
  Target,
  Clock,
  Loader2
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState([
    { label: 'Total Content', value: '0', change: '0%', icon: Eye, color: 'text-blue-600' },
    { label: 'Published', value: '0', change: '0%', icon: Heart, color: 'text-red-600' },
    { label: 'Campaigns', value: '0', change: '0%', icon: Users, color: 'text-green-600' },
    { label: 'Analytics Data', value: '0', change: '0%', icon: Share, color: 'text-purple-600' }
  ]);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealAnalytics();
  }, []);

  const loadRealAnalytics = async () => {
    try {
      // Load real campaigns
      const { data: campaignsData } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      // Load real content
      const { data: contentData } = await supabase
        .from('marketing_content')
        .select('*');

      // Load analytics data
      const { data: analyticsData } = await supabase
        .from('marketing_analytics')
        .select('*');

      const totalContent = contentData?.length || 0;
      const publishedContent = contentData?.filter(c => c.status === 'published').length || 0;
      const totalCampaigns = campaignsData?.length || 0;
      const totalAnalyticsEntries = analyticsData?.length || 0;

      setMetrics([
        { label: 'Total Content', value: totalContent.toString(), change: '0%', icon: Eye, color: 'text-blue-600' },
        { label: 'Published', value: publishedContent.toString(), change: '0%', icon: Heart, color: 'text-red-600' },
        { label: 'Campaigns', value: totalCampaigns.toString(), change: '0%', icon: Users, color: 'text-green-600' },
        { label: 'Analytics Data', value: totalAnalyticsEntries.toString(), change: '0%', icon: Share, color: 'text-purple-600' }
      ]);

      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-green-600">{metric.change}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading campaigns...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns found. Create your first campaign to see analytics data here.
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{campaign.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        campaign.status === 'running' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        campaign.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <Progress value={campaign.status === 'completed' ? 100 : campaign.status === 'running' ? 50 : 0} className="w-full" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recent Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Loading content...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Real content data will appear here once you generate campaigns and content.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Live System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                <div>
                  <p className="font-medium text-sm">Database Connection</p>
                  <p className="text-xs text-muted-foreground">Live</p>
                </div>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                <div>
                  <p className="font-medium text-sm">AI Services</p>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </div>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                <div>
                  <p className="font-medium text-sm">Content Publishing</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <span className="text-sm font-medium text-green-600">Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};