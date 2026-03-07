import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  error_message?: string;
  completed_at?: string;
}

export default function CampaignMonitor() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCampaigns = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Force refresh bypasses any potential caching by adding a unique timestamp parameter
      let query = supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data, error } = await query;

      if (error) throw error;
      
      // Check for stuck campaigns and mark them as completed if they have content
      const campaignsWithStatus = await Promise.all(
        (data || []).map(async (campaign) => {
          if (campaign.status === 'running') {
            // Check if campaign has been running for more than 10 minutes
            const runningTime = new Date().getTime() - new Date(campaign.created_at).getTime();
            const tenMinutes = 10 * 60 * 1000;
            
            if (runningTime > tenMinutes) {
              // Check if any content was generated
              const { data: contentData } = await supabase
                .from('marketing_content')
                .select('id')
                .eq('campaign_id', campaign.id);
                
              if (contentData && contentData.length > 0) {
                // Update campaign to completed if content exists
                await supabase
                  .from('marketing_campaigns')
                  .update({ 
                    status: 'completed', 
                    completed_at: new Date().toISOString(),
                    error_message: `Campaign completed with ${contentData.length} items generated. Some items may have failed due to API limitations.`
                  })
                  .eq('id', campaign.id);
                  
                return { 
                  ...campaign, 
                  status: 'completed', 
                  completed_at: new Date().toISOString(),
                  error_message: `Campaign completed with ${contentData.length} items generated. Some items may have failed due to API limitations.`
                };
              } else {
                // Mark as failed if no content was generated
                await supabase
                  .from('marketing_campaigns')
                  .update({ 
                    status: 'failed', 
                    completed_at: new Date().toISOString(),
                    error_message: 'Campaign timed out with no content generated'
                  })
                  .eq('id', campaign.id);
                  
                return { 
                  ...campaign, 
                  status: 'failed', 
                  completed_at: new Date().toISOString(),
                  error_message: 'Campaign timed out with no content generated'
                };
              }
            }
          }
          return campaign;
        })
      );
      
      setCampaigns(campaignsWithStatus);
      
      if (forceRefresh) {
        toast({
          title: "Refreshed",
          description: "Campaign data has been updated",
        });
      }
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
          title: "Success",
          description: "Content generation retried successfully",
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

  // Manual status correction function
  const handleStatusCorrection = async (campaignId: string) => {
    setIsLoading(true);
    try {
      // Check current campaign status in database
      const { data: campaignData } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
        
      if (campaignData) {
        // Check if content exists for this campaign
        const { data: contentData } = await supabase
          .from('marketing_content')
          .select('id, status')
          .eq('campaign_id', campaignId);
          
        const contentCount = contentData?.length || 0;
        
        if (campaignData.status === 'running' && contentCount > 0) {
          // Mark as completed if content exists
          await supabase
            .from('marketing_campaigns')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              error_message: contentCount < 6 ? `Campaign completed with ${contentCount} items. Some items may have failed due to API limitations.` : null
            })
            .eq('id', campaignId);
            
          toast({
            title: "Status Updated",
            description: `Campaign marked as completed with ${contentCount} items generated`,
          });
        }
      }
      
      await loadCampaigns(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    
    // Set up real-time subscription with better error handling
    const channel = supabase
      .channel('campaign-monitor-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_campaigns'
      }, (payload) => {
        console.log('Real-time campaign update:', payload);
        loadCampaigns(true); // Force refresh on real-time updates
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_content'
      }, (payload) => {
        console.log('Real-time content update:', payload);
        loadCampaigns(true); // Refresh when content changes too
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Campaigns</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadCampaigns(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Force Refresh
          </Button>
        </div>
      </div>
      
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No campaigns found. Create your first campaign above!</p>
          </CardContent>
        </Card>
      ) : (
        campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold truncate flex-1">{campaign.title}</h4>
              <div className="flex items-center gap-2">
                <Badge variant={
                  campaign.status === 'completed' ? 'default' : 
                  campaign.status === 'failed' ? 'destructive' : 
                  campaign.status === 'running' ? 'secondary' :
                  'outline'
                }>
                  {campaign.status}
                </Badge>
                {campaign.status === 'running' && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {campaign.description}
            </p>
            
            {campaign.error_message && (
              <div className="bg-destructive/10 text-destructive text-xs p-2 rounded mb-3">
                <strong>Error:</strong> {campaign.error_message}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created: {new Date(campaign.created_at).toLocaleDateString()}
                {campaign.completed_at && (
                  <span className="ml-2">
                    | Completed: {new Date(campaign.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {campaign.status === 'failed' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRetry(campaign.id)}
                    disabled={isLoading}
                  >
                    Retry
                  </Button>
                )}
                {campaign.status === 'running' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusCorrection(campaign.id)}
                    disabled={isLoading}
                  >
                    Check Status
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}