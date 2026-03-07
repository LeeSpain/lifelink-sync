import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Users,
  Heart,
  Eye,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Search,
  Download,
  Settings,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  Timer,
  Send,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  error_message?: string;
  completed_at?: string;
  settings?: any;
  content_generated?: number;
  content_approved?: number;
  content_published?: number;
  performance_metrics?: {
    views: number;
    engagement: number;
    clicks: number;
    conversions: number;
    reach: number;
    ctr: number;
    engagement_rate: number;
  };
}

const AdvancedCampaignMonitor: React.FC = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      // Fetch campaigns with real content and analytics data
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (campaignsError) throw campaignsError;

      // Fetch real content counts and analytics for each campaign
      const enhancedCampaigns = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          // Get real content counts
          const { data: contentData } = await supabase
            .from('marketing_content')
            .select('status')
            .eq('campaign_id', campaign.id);

          const content_generated = contentData?.length || 0;
          const content_approved = contentData?.filter(c => c.status === 'approved').length || 0;
          const content_published = contentData?.filter(c => c.status === 'published').length || 0;

          // Get real analytics data
          const { data: analyticsData } = await supabase
            .from('marketing_analytics')
            .select('metric_type, metric_value')
            .eq('campaign_id', campaign.id);

          // Aggregate analytics by metric type
          const analytics = analyticsData?.reduce((acc, metric) => {
            if (!acc[metric.metric_type]) acc[metric.metric_type] = 0;
            acc[metric.metric_type] += Number(metric.metric_value) || 0;
            return acc;
          }, {} as Record<string, number>) || {};

          const performance_metrics = {
            views: analytics.views || 0,
            engagement: analytics.engagement || 0,
            clicks: analytics.clicks || 0,
            conversions: analytics.conversions || 0,
            reach: analytics.reach || 0,
            ctr: analytics.clicks && analytics.views ? (analytics.clicks / analytics.views * 100) : 0,
            engagement_rate: analytics.engagement && analytics.reach ? (analytics.engagement / analytics.reach * 100) : 0
          };

          return {
            ...campaign,
            content_generated,
            content_approved,
            content_published,
            performance_metrics
          };
        })
      );
      
      setCampaigns(enhancedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (campaignId: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: {
          action: 'generate_content',
          campaign_id: campaignId,
          settings: {
            auto_approve_content: false,
            content_quality: 'high',
            seo_optimization: true
          }
        }
      });

      if (response.data?.success) {
        toast({
          title: "Campaign Restarted",
          description: "Content generation has been restarted successfully",
        });
        await loadCampaigns();
      } else {
        throw new Error(response.data?.error || 'Retry failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Failed to retry campaign',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Paused",
        description: "Campaign has been paused successfully",
      });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause campaign",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status: 'running' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Resumed",
        description: "Campaign has been resumed successfully",
      });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume campaign",
        variant: "destructive"
      });
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campaign deleted',
        description: 'Campaign has been permanently removed.',
      });
      await loadCampaigns();
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Delete failed', description: 'Could not delete campaign', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCampaign = async (updatedData: any) => {
    if (!editingCampaign) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCampaign.id);

      if (error) throw error;

      toast({
        title: 'Campaign updated',
        description: 'Campaign details have been saved.',
      });
      setEditingCampaign(null);
      await loadCampaigns();
    } catch (err) {
      console.error('Update error:', err);
      toast({ title: 'Update failed', description: 'Could not update campaign', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    
    const channel = supabase
      .channel('campaign-monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_campaigns'
      }, () => {
        loadCampaigns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortBy, sortOrder]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesSearch = !searchQuery || 
      campaign.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Advanced Campaign Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring and performance tracking for all marketing campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={loadCampaigns}
            disabled={isLoading}
            className="hover-scale"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="hover-scale">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Advanced Filters & Search */}
      <Card className="bg-gradient-to-r from-background/80 to-muted/30 border-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search Campaigns</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full h-10 px-3 py-2 text-sm bg-background/80 border border-primary/20 rounded-md"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="completed_at">Completion Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Order</label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total</p>
                <p className="text-2xl font-bold text-blue-900">{campaigns.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Running</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {campaigns.filter(c => c.status === 'running').length}
                </p>
              </div>
              <Loader2 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {campaigns.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Failed</p>
                <p className="text-2xl font-bold text-red-900">
                  {campaigns.filter(c => c.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Avg. Content</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(campaigns.reduce((sum, c) => sum + (c.content_generated || 0), 0) / Math.max(campaigns.length, 1)).toFixed(0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="text-center py-16">
            <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {searchQuery || statusFilter !== 'all' ? 'No Campaigns Match Filters' : 'No Campaigns Found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first marketing campaign to start monitoring performance'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(campaign.status)}
                    <CardTitle className="text-lg line-clamp-1">{campaign.title}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(campaign.status) as any}>
                      {campaign.status}
                    </Badge>
                    {campaign.status === 'running' && (
                      <Badge variant="outline" className="animate-pulse">
                        <Activity className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-md z-[100]" sideOffset={5}>
                      <DropdownMenuItem 
                        onClick={() => handleEditCampaign(campaign)}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Campaign
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-destructive cursor-pointer focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {campaign.description}
                </p>

                {/* Performance Metrics Grid */}
                {campaign.performance_metrics && (
                  <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg mb-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-600">
                        {formatNumber(campaign.performance_metrics.views)}
                      </p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-600">
                        {campaign.performance_metrics.engagement}
                      </p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-purple-600">
                        {campaign.performance_metrics.clicks}
                      </p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-orange-600">
                        {campaign.performance_metrics.ctr.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-pink-600">
                        {formatNumber(campaign.performance_metrics.reach)}
                      </p>
                      <p className="text-xs text-muted-foreground">Reach</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-indigo-600">
                        {campaign.performance_metrics.engagement_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Eng. Rate</p>
                    </div>
                  </div>
                )}

                {/* Content Progress */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Content Progress</span>
                    <span className="text-muted-foreground">
                      {campaign.content_published || 0} / {campaign.content_generated || 0} published
                    </span>
                  </div>
                  <Progress 
                    value={((campaign.content_published || 0) / Math.max(campaign.content_generated || 1, 1)) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Generated: {campaign.content_generated || 0}</span>
                    <span>Approved: {campaign.content_approved || 0}</span>
                    <span>Published: {campaign.content_published || 0}</span>
                  </div>
                </div>

                {/* Error Message */}
                {campaign.error_message && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Error:</strong> {campaign.error_message}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="flex items-center text-xs text-muted-foreground space-x-4 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                  {campaign.completed_at && (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed: {new Date(campaign.completed_at).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-1" />
                    Duration: {campaign.completed_at 
                      ? Math.round((new Date(campaign.completed_at).getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60)) + 'h'
                      : Math.round((new Date().getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60)) + 'h'
                    }
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCampaign(campaign)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Campaign Details: {selectedCampaign?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Campaign Overview */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Campaign Overview
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    {getStatusIcon(selectedCampaign?.status || '')}
                                    <Badge variant={getStatusBadgeVariant(selectedCampaign?.status || '') as any}>
                                      {selectedCampaign?.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Content Generated</label>
                                  <p className="text-lg font-semibold">{selectedCampaign?.content_generated || 0}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                                  <p className="text-sm">{selectedCampaign ? new Date(selectedCampaign.created_at).toLocaleString() : ''}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Completed</label>
                                  <p className="text-sm">{selectedCampaign?.completed_at ? new Date(selectedCampaign.completed_at).toLocaleString() : 'Not completed'}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Performance Metrics */}
                          {selectedCampaign?.performance_metrics && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <BarChart3 className="h-5 w-5" />
                                  Performance Metrics
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-blue-900">{formatNumber(selectedCampaign.performance_metrics.views)}</p>
                                    <p className="text-sm text-blue-700">Total Views</p>
                                  </div>
                                  <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <Heart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-green-900">{selectedCampaign.performance_metrics.engagement}</p>
                                    <p className="text-sm text-green-700">Engagement</p>
                                  </div>
                                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-purple-900">{selectedCampaign.performance_metrics.clicks}</p>
                                    <p className="text-sm text-purple-700">Clicks</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Error Details */}
                          {selectedCampaign?.error_message && (
                            <Card className="border-red-200">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                  <AlertTriangle className="h-5 w-5" />
                                  Error Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="bg-red-50 p-4 rounded-lg">
                                  <p className="text-red-800">{selectedCampaign.error_message}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {campaign.status === 'failed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRetry(campaign.id)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}

                    {campaign.status === 'running' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => pauseCampaign(campaign.id)}
                      >
                        <PauseCircle className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}

                    {campaign.status === 'paused' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resumeCampaign(campaign.id)}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          {editingCampaign && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveCampaign({
                title: formData.get('title'),
                description: formData.get('description')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingCampaign.title}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingCampaign.description}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingCampaign(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedCampaignMonitor;