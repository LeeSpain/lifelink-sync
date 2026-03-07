import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Mail, TrendingUp, Users, Eye, MousePointer, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailMetrics {
  total_campaigns: number;
  total_emails_sent: number;
  total_emails_delivered: number;
  total_emails_opened: number;
  total_emails_clicked: number;
  total_emails_failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

interface CampaignStats {
  id: string;
  name: string;
  sent_at: string;
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  status: string;
}

interface RivenCampaignMetric {
  campaign_id: string;
  emails_sent: number;
  emails_failed: number;
  replies_received: number;
  reply_rate: number;
  social_posts_posted: number;
  social_posts_failed: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const EmailAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [rivenMetrics, setRivenMetrics] = useState<RivenCampaignMetric[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'campaigns' | 'performance'>('overview');

  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Load email queue statistics
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('status, sent_at, created_at, campaign_id')
        .gte('created_at', getDateRange(timeRange));

      if (queueError) throw queueError;

      // Load campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('id, name, status, created_at, recipient_count')
        .gte('created_at', getDateRange(timeRange));

      if (campaignError) throw campaignError;

      // Load Riven feedback metrics (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: rivenData, error: rivenError } = await supabase
        .from('riven_campaign_metrics_daily')
        .select('campaign_id, emails_sent, emails_failed, replies_received, reply_rate, social_posts_posted, social_posts_failed')
        .gte('metric_date', sevenDaysAgo);

      if (!rivenError && rivenData) {
        // Aggregate by campaign_id
        const aggregated = new Map<string, RivenCampaignMetric>();
        for (const row of rivenData) {
          const existing = aggregated.get(row.campaign_id);
          if (existing) {
            existing.emails_sent += row.emails_sent || 0;
            existing.emails_failed += row.emails_failed || 0;
            existing.replies_received += row.replies_received || 0;
            existing.social_posts_posted += row.social_posts_posted || 0;
            existing.social_posts_failed += row.social_posts_failed || 0;
          } else {
            aggregated.set(row.campaign_id, {
              campaign_id: row.campaign_id,
              emails_sent: row.emails_sent || 0,
              emails_failed: row.emails_failed || 0,
              replies_received: row.replies_received || 0,
              reply_rate: 0,
              social_posts_posted: row.social_posts_posted || 0,
              social_posts_failed: row.social_posts_failed || 0
            });
          }
        }
        // Calculate reply rates
        for (const metric of aggregated.values()) {
          metric.reply_rate = metric.emails_sent > 0 ? (metric.replies_received / metric.emails_sent) * 100 : 0;
        }
        setRivenMetrics(Array.from(aggregated.values()));
      }

      // Process metrics
      const processedMetrics = processEmailMetrics(queueData || []);
      const processedCampaigns = processCampaignStats(campaignData || [], queueData || []);

      setMetrics(processedMetrics);
      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load email analytics data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const processEmailMetrics = (queueData: any[]): EmailMetrics => {
    const total_emails_sent = queueData.length;
    const total_emails_delivered = queueData.filter(email => email.status === 'sent').length;
    const total_emails_failed = queueData.filter(email => email.status === 'failed').length;
    
    // Simulate open and click data (would come from email tracking service)
    const total_emails_opened = Math.floor(total_emails_delivered * 0.25); // 25% open rate
    const total_emails_clicked = Math.floor(total_emails_opened * 0.15); // 15% click rate of opens

    const delivery_rate = total_emails_sent > 0 ? (total_emails_delivered / total_emails_sent) * 100 : 0;
    const open_rate = total_emails_delivered > 0 ? (total_emails_opened / total_emails_delivered) * 100 : 0;
    const click_rate = total_emails_opened > 0 ? (total_emails_clicked / total_emails_opened) * 100 : 0;
    const bounce_rate = total_emails_sent > 0 ? (total_emails_failed / total_emails_sent) * 100 : 0;

    return {
      total_campaigns: new Set(queueData.map(email => email.campaign_id)).size,
      total_emails_sent,
      total_emails_delivered,
      total_emails_opened,
      total_emails_clicked,
      total_emails_failed,
      delivery_rate,
      open_rate,
      click_rate,
      bounce_rate
    };
  };

  const processCampaignStats = (campaignData: any[], queueData: any[]): CampaignStats[] => {
    return campaignData.map(campaign => {
      const campaignEmails = queueData.filter(email => email.campaign_id === campaign.id);
      const delivered_count = campaignEmails.filter(email => email.status === 'sent').length;
      const failed_count = campaignEmails.filter(email => email.status === 'failed').length;
      const opened_count = Math.floor(delivered_count * 0.25); // Simulated
      const clicked_count = Math.floor(opened_count * 0.15); // Simulated

      return {
        id: campaign.id,
        name: campaign.name,
        sent_at: campaign.created_at,
        recipient_count: campaign.recipient_count || campaignEmails.length,
        delivered_count,
        opened_count,
        clicked_count,
        failed_count,
        status: campaign.status
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'pending':
      case 'queued':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const pieChartData = metrics ? [
    { name: 'Delivered', value: metrics.total_emails_delivered, color: COLORS[0] },
    { name: 'Opened', value: metrics.total_emails_opened, color: COLORS[1] },
    { name: 'Clicked', value: metrics.total_emails_clicked, color: COLORS[2] },
    { name: 'Failed', value: metrics.total_emails_failed, color: COLORS[3] }
  ] : [];

  const campaignChartData = campaigns.map(campaign => ({
    name: campaign.name.substring(0, 15) + '...',
    sent: campaign.recipient_count,
    delivered: campaign.delivered_count,
    opened: campaign.opened_count,
    clicked: campaign.clicked_count
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Analytics</h2>
          <p className="text-muted-foreground">Track your email campaign performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold">{metrics.total_emails_sent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold">{metrics.delivery_rate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                  <p className="text-2xl font-bold">{metrics.open_rate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MousePointer className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                  <p className="text-2xl font-bold">{metrics.click_rate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                    <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                    <Bar dataKey="opened" fill="#ffc658" name="Opened" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(campaign.status)}
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(campaign.sent_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{campaign.recipient_count} recipients</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.delivered_count} delivered, {campaign.opened_count} opened
                        </p>
                      </div>
                      <Badge variant={getStatusColor(campaign.status) as any}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && (
                  <>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Rate</span>
                        <span>{metrics.delivery_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.delivery_rate} className="mt-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Open Rate</span>
                        <span>{metrics.open_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.open_rate} className="mt-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Click Rate</span>
                        <span>{metrics.click_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.click_rate} className="mt-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Bounce Rate</span>
                        <span>{metrics.bounce_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.bounce_rate} className="mt-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={campaignChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="delivered" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="opened" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="clicked" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Riven Feedback Metrics */}
      {rivenMetrics.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Riven Feedback (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Campaign</th>
                    <th className="text-right py-2 px-3 font-medium">Emails Sent</th>
                    <th className="text-right py-2 px-3 font-medium">Replies</th>
                    <th className="text-right py-2 px-3 font-medium">Reply Rate</th>
                    <th className="text-right py-2 px-3 font-medium">Social Posts</th>
                    <th className="text-center py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rivenMetrics.map((metric) => (
                    <tr key={metric.campaign_id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">
                        {metric.campaign_id === 'unknown' ? 'Untracked' : metric.campaign_id.substring(0, 20)}
                        {metric.campaign_id.length > 20 && '...'}
                      </td>
                      <td className="text-right py-2 px-3">
                        {metric.emails_sent.toLocaleString()}
                        {metric.emails_failed > 0 && (
                          <span className="text-destructive text-xs ml-1">({metric.emails_failed} failed)</span>
                        )}
                      </td>
                      <td className="text-right py-2 px-3">{metric.replies_received}</td>
                      <td className="text-right py-2 px-3">{metric.reply_rate.toFixed(1)}%</td>
                      <td className="text-right py-2 px-3">
                        {metric.social_posts_posted}
                        {metric.social_posts_failed > 0 && (
                          <span className="text-destructive text-xs ml-1">({metric.social_posts_failed} failed)</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-3">
                        <Badge 
                          variant={metric.reply_rate >= 5 ? 'default' : metric.reply_rate >= 2 ? 'secondary' : 'outline'}
                          className={
                            metric.reply_rate >= 5 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : metric.reply_rate >= 2 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                : ''
                          }
                        >
                          {metric.reply_rate >= 5 ? 'Good' : metric.reply_rate >= 2 ? 'Medium' : 'Low'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rivenMetrics.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No campaign metrics yet</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};