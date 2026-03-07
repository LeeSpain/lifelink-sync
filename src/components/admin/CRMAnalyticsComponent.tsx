import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Eye, 
  MousePointer, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CRMAnalytics {
  totalContacts: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  bounceRate: number;
  conversionRate: number;
  activeSubscribers: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    sent_count: number;
    open_rate: number;
    click_rate: number;
    created_at: string;
    status: string;
  }>;
  topPerformingGroups: Array<{
    name: string;
    engagement_rate: number;
    total_sent: number;
  }>;
}

export const CRMAnalyticsComponent: React.FC = () => {
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load campaign data
      const { data: campaigns, error: campaignError } = await supabase
        .from('bulk_campaigns')
        .select('*')
        .eq('channel', 'email');

      if (campaignError) throw campaignError;

      // Load contact counts
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id');

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, subscription_regional');

      if (leadsError) console.warn('Error loading leads:', leadsError);
      if (profilesError) console.warn('Error loading profiles:', profilesError);

      // Load email queue stats
      const { data: emailQueue, error: queueError } = await supabase
        .from('email_queue')
        .select('status, sent_at');

      if (queueError) throw queueError;

      // Calculate analytics
      const totalContacts = (leads?.length || 0) + (profiles?.length || 0);
      const totalCampaigns = campaigns?.length || 0;
      const totalEmailsSent = emailQueue?.filter(email => email.status === 'sent').length || 0;
      const totalPending = emailQueue?.filter(email => email.status === 'pending').length || 0;
      const totalFailed = emailQueue?.filter(email => email.status === 'failed').length || 0;
      const activeSubscribers = profiles?.filter(p => p.subscription_regional).length || 0;

      // Mock some analytics for demonstration
      const analyticsData: CRMAnalytics = {
        totalContacts,
        totalCampaigns,
        totalEmailsSent,
        averageOpenRate: totalEmailsSent > 0 ? Math.round(Math.random() * 30 + 15) : 0,
        averageClickRate: totalEmailsSent > 0 ? Math.round(Math.random() * 8 + 2) : 0,
        bounceRate: totalEmailsSent > 0 ? Math.round((totalFailed / (totalEmailsSent + totalFailed)) * 100) : 0,
        conversionRate: totalEmailsSent > 0 ? Math.round(Math.random() * 5 + 1) : 0,
        activeSubscribers,
        recentCampaigns: campaigns?.slice(0, 5).map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          sent_count: campaign.sent_count || 0,
          open_rate: Math.round(Math.random() * 40 + 10),
          click_rate: Math.round(Math.random() * 10 + 2),
          created_at: campaign.created_at,
          status: campaign.status
        })) || [],
        topPerformingGroups: [
          { name: 'Members', engagement_rate: 85, total_sent: activeSubscribers },
          { name: 'High Score Leads', engagement_rate: 72, total_sent: Math.floor(totalContacts * 0.3) },
          { name: 'Spain Users', engagement_rate: 68, total_sent: Math.floor(totalContacts * 0.4) },
          { name: 'Recent Leads', engagement_rate: 45, total_sent: Math.floor(totalContacts * 0.2) }
        ]
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button onClick={loadAnalytics} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.totalContacts.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Contacts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.totalEmailsSent.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Emails Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.averageOpenRate}%</div>
                <div className="text-sm text-muted-foreground">Avg Open Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <MousePointer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.averageClickRate}%</div>
                <div className="text-sm text-muted-foreground">Avg Click Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Open Rate</span>
                <span className="text-sm font-medium">{analytics.averageOpenRate}%</span>
              </div>
              <Progress value={analytics.averageOpenRate} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Click Rate</span>
                <span className="text-sm font-medium">{analytics.averageClickRate}%</span>
              </div>
              <Progress value={analytics.averageClickRate} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Bounce Rate</span>
                <span className="text-sm font-medium">{analytics.bounceRate}%</span>
              </div>
              <Progress value={analytics.bounceRate} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversion Rate</span>
                <span className="text-sm font-medium">{analytics.conversionRate}%</span>
              </div>
              <Progress value={analytics.conversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Performing Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingGroups.map((group, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {group.engagement_rate}%
                      </span>
                    </div>
                    <Progress value={group.engagement_rate} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {group.total_sent.toLocaleString()} contacts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No campaigns found
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{campaign.sent_count.toLocaleString()}</div>
                      <div className="text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{campaign.open_rate}%</div>
                      <div className="text-muted-foreground">Opened</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{campaign.click_rate}%</div>
                      <div className="text-muted-foreground">Clicked</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Best Performing Group</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {analytics.topPerformingGroups[0]?.name} has the highest engagement rate at {analytics.topPerformingGroups[0]?.engagement_rate}%
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Growth Opportunity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {analytics.activeSubscribers} active subscribers represent {Math.round((analytics.activeSubscribers / analytics.totalContacts) * 100)}% of your total contacts
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Campaign Activity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {analytics.totalCampaigns} total campaigns with an average of {Math.round(analytics.totalEmailsSent / Math.max(analytics.totalCampaigns, 1))} emails per campaign
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Optimization Tip</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your bounce rate of {analytics.bounceRate}% is {analytics.bounceRate < 5 ? 'excellent' : analytics.bounceRate < 10 ? 'good' : 'needs improvement'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};