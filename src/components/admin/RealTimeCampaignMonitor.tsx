import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Activity,
  Users,
  Heart,
  Eye,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Trash2,
  Edit,
  MoreVertical
} from 'lucide-react';

interface RealTimeCampaignMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RealTimeCampaignMonitor: React.FC<RealTimeCampaignMonitorProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      // Auto-cleanup stale campaigns first
      await supabase.functions.invoke('campaign-manager', {
        body: { action: 'cleanup_stale' }
      });

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanSystem = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-cleaner', {
        body: { action: 'execute', confirm: true }
      });
      if (error) throw error;

      toast({
        title: 'Complete cleanup done',
        description: `Removed ALL ${data?.deleted?.content ?? 0} content items and ${data?.deleted?.campaigns ?? 0} campaigns from Riven.`,
      });
      await loadCampaigns();
    } catch (err) {
      console.error('Cleanup error:', err);
      toast({ title: 'Cleanup failed', description: 'Could not clean unpublished items', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCampaign = (campaign: any) => {
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Campaign Monitor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button variant="destructive" onClick={handleCleanSystem} disabled={isLoading} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ALL Riven Content
            </Button>
          </div>
          {campaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No campaigns found. All systems operational!</p>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{campaign.title || 'Campaign'}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={campaign.status === 'running' ? 'default' : campaign.status === 'failed' ? 'destructive' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                      {campaign.status === 'running' && (
                        <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-[100]">
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
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Created: {format(new Date(campaign.created_at), 'PPp')}
                  </p>
                  {campaign.status === 'running' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
                      <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                      Generating blog content & DALL-E image...
                    </div>
                  )}
                  {campaign.error_message && (
                    <div className="p-2 bg-destructive/10 text-destructive text-sm rounded">
                      Error: {campaign.error_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Campaign Dialog */}
        {editingCampaign && (
          <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    defaultValue={editingCampaign.title}
                    onChange={(e) => setEditingCampaign({...editingCampaign, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full p-2 border rounded h-20"
                    defaultValue={editingCampaign.description}
                    onChange={(e) => setEditingCampaign({...editingCampaign, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingCampaign(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveCampaign(editingCampaign)}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};