import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CampaignDetailsModal } from './CampaignDetailsModal';
import {
  Search,
  Filter,
  Eye,
  Play,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Target,
  TrendingUp,
  RefreshCw,
  Plus,
  BookOpen,
  Share2,
  Mail,
  AlertTriangle,
  MoreVertical,
  Clock,
  Users,
  Activity,
  Square
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  command_input: string;
  target_audience: any;
  budget_estimate: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  scheduled_at?: string;
  content_count?: number;
  blog_count?: number;
  social_count?: number;
  email_count?: number;
}

export const EnhancedMarketingCampaigns: React.FC = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCampaigns();
    setupRealtimeSubscription();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // Load campaigns with content counts
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Load content counts for each campaign
      const campaignsWithCounts = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: contentData } = await supabase
            .from('marketing_content')
            .select('content_type')
            .eq('campaign_id', campaign.id);

          const contentCounts = (contentData || []).reduce((acc, item) => {
            acc.total++;
            if (item.content_type === 'blog_post') acc.blog++;
            else if (item.content_type === 'social_post') acc.social++;
            else if (item.content_type === 'email_campaign') acc.email++;
            return acc;
          }, { total: 0, blog: 0, social: 0, email: 0 });

          return {
            ...campaign,
            content_count: contentCounts.total,
            blog_count: contentCounts.blog,
            social_count: contentCounts.social,
            email_count: contentCounts.email
          };
        })
      );

      setCampaigns(campaignsWithCounts);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('enhanced-campaigns-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_campaigns'
      }, () => {
        loadCampaigns();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_content'
      }, () => {
        loadCampaigns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: `Campaign ${status === 'paused' ? 'Paused' : 'Resumed'}`,
        description: `Campaign has been ${status === 'paused' ? 'paused' : 'resumed'} successfully`
      });

      loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Status Update Failed",
        description: "Failed to update campaign status",
        variant: "destructive"
      });
    }
  };

  const handleForceComplete = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: { action: 'force_complete', campaign_id: campaignId }
      });

      if (error) throw error;

      toast({
        title: "Campaign Completed",
        description: "Campaign has been marked as completed successfully"
      });

      loadCampaigns();
    } catch (error) {
      console.error('Error force completing campaign:', error);
      toast({
        title: "Force Complete Failed",
        description: "Failed to force complete campaign",
        variant: "destructive"
      });
    }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: { action: 'cancel', campaign_id: campaignId }
      });

      if (error) throw error;

      toast({
        title: "Campaign Cancelled",
        description: "Campaign has been cancelled successfully"
      });

      loadCampaigns();
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel campaign",
        variant: "destructive"
      });
    }
  };

  const cleanupStaleCampaigns = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: { action: 'cleanup_stale' }
      });

      if (error) throw error;

      if (data?.cleaned_count > 0) {
        toast({
          title: "Cleanup Complete",
          description: `Cleaned up ${data.cleaned_count} stale campaigns`
        });
        loadCampaigns();
      } else {
        toast({
          title: "No Cleanup Needed",
          description: "No stale campaigns found"
        });
      }
    } catch (error) {
      console.error('Error cleaning up campaigns:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup stale campaigns",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    setDeleting(true);
    try {
      // First delete all related content
      const { error: contentError } = await supabase
        .from('marketing_content')
        .delete()
        .eq('campaign_id', campaignToDelete.id);

      if (contentError) throw contentError;

      // Then delete the campaign
      const { error: campaignError } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignToDelete.id);

      if (campaignError) throw campaignError;

      toast({
        title: "Campaign Deleted",
        description: `"${campaignToDelete.title}" and all its content have been deleted successfully`,
      });

      setDeleteModalOpen(false);
      setCampaignToDelete(null);
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteModalOpen(true);
  };

  const openCampaignDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDetailsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: "default",
      active: "default",
      paused: "secondary",
      completed: "outline",
      draft: "outline"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.command_input.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Campaigns</p>
            <p className="text-sm text-muted-foreground">Fetching your marketing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Marketing Campaigns
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and track your AI-powered marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={cleanupStaleCampaigns} variant="outline" className="hover-scale">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Cleanup Stale
          </Button>
          <Button onClick={loadCampaigns} variant="outline" className="hover-scale">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-6 bg-gradient-to-r from-background/50 to-muted/50 border-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search Campaigns</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or command..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/80 border-primary/20 focus:border-primary/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Filter by Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-background/80 border-primary/20">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="running">🟢 Running</SelectItem>
                  <SelectItem value="active">🟢 Active</SelectItem>
                  <SelectItem value="paused">🟡 Paused</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="draft">📝 Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Total Campaigns</p>
                <p className="text-3xl font-bold text-blue-900">{campaigns.length}</p>
                <p className="text-xs text-blue-600">All time</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Active Now</p>
                <p className="text-3xl font-bold text-green-900">
                  {campaigns.filter(c => c.status === 'running' || c.status === 'active').length}
                </p>
                <p className="text-xs text-green-600">Currently running</p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">Total Content</p>
                <p className="text-3xl font-bold text-purple-900">
                  {campaigns.reduce((sum, c) => sum + (c.content_count || 0), 0)}
                </p>
                <p className="text-xs text-purple-600">Pieces generated</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-700">Blog Articles</p>
                <p className="text-3xl font-bold text-orange-900">
                  {campaigns.reduce((sum, c) => sum + (c.blog_count || 0), 0)}
                </p>
                <p className="text-xs text-orange-600">Published content</p>
              </div>
              <div className="h-12 w-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200/50 hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-teal-700">Social Posts</p>
                <p className="text-3xl font-bold text-teal-900">
                  {campaigns.reduce((sum, c) => sum + (c.social_count || 0), 0)}
                </p>
                <p className="text-xs text-teal-600">Cross-platform</p>
              </div>
              <div className="h-12 w-12 bg-teal-500/20 rounded-full flex items-center justify-center">
                <Share2 className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign, index) => (
          <Card 
            key={campaign.id} 
            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary/20 hover:border-l-primary animate-fade-in bg-gradient-to-br from-background to-muted/20"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getStatusIcon(campaign.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(campaign.status)}
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(campaign.created_at).split(',')[0]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {campaign.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Enhanced Content Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border border-orange-200/50 hover-scale">
                  <BookOpen className="h-5 w-5 mx-auto mb-2 text-orange-600" />
                  <p className="text-xs font-medium text-orange-700">Blog Posts</p>
                  <p className="text-lg font-bold text-orange-900">{campaign.blog_count || 0}</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/50 hover-scale">
                  <Share2 className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-xs font-medium text-blue-700">Social Media</p>
                  <p className="text-lg font-bold text-blue-900">{campaign.social_count || 0}</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200/50 hover-scale">
                  <Mail className="h-5 w-5 mx-auto mb-2 text-green-600" />
                  <p className="text-xs font-medium text-green-700">Email</p>
                  <p className="text-lg font-bold text-green-900">{campaign.email_count || 0}</p>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Total Content
                  </span>
                  <span className="font-semibold">{campaign.content_count || 0} pieces</span>
                </div>
                {campaign.command_input && (
                  <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border-l-2 border-l-primary/30">
                    <span className="font-medium text-primary">AI Command:</span>
                    <p className="mt-1 italic">"{campaign.command_input.slice(0, 80)}..."</p>
                  </div>
                )}
              </div>

              {/* Enhanced Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCampaignDetails(campaign)}
                  className="flex-1 group/btn hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  View Details
                </Button>
                
                {campaign.status === 'running' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                      className="hover:bg-yellow-500 hover:text-white transition-colors"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleForceComplete(campaign.id)}
                      className="hover:bg-green-500 hover:text-white transition-colors"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelCampaign(campaign.id)}
                      className="hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </>
                ) : campaign.status === 'paused' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateCampaignStatus(campaign.id, 'running')}
                    className="hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDeleteCampaign(campaign)}
                    className="hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Empty State */}
      {filteredCampaigns.length === 0 && (
        <Card className="animate-fade-in">
          <CardContent className="text-center py-16">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-24 w-24 mx-auto bg-primary/5 rounded-full flex items-center justify-center">
                <Target className="h-12 w-12 text-primary/40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No campaigns found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                    : 'Ready to create your first AI-powered marketing campaign? Head to the Command Center to get started.'
                  }
                </p>
              </div>
              {!searchTerm && statusFilter === 'all' && (
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Are you sure you want to delete <strong>"{campaignToDelete?.title}"</strong>?</p>
              <p className="text-red-600 font-medium">
                This will permanently delete the campaign and all its associated content ({campaignToDelete?.content_count || 0} pieces).
              </p>
              <p>This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCampaign}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedCampaign(null);
          }}
          onCampaignUpdate={loadCampaigns}
        />
      )}
    </div>
  );
};