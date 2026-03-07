import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Activity, BarChart3, Settings, Users, Target, Brain, Database, Cpu, Zap } from 'lucide-react';
import { useOptimizedSupabaseQuery, useBatchQueries, clearCache } from '@/hooks/useOptimizedQuery';
import OptimizedComponentLoader from './OptimizedComponentLoader';

export default function OptimizedRivenMarketingAI() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('command-center');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Command Center state
  const [currentCommand, setCurrentCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rivenResponse, setRivenResponse] = useState('');
  
  // Emergency/Family Safety focused command templates
  const commandTemplates = [
    {
      id: '1',
      title: 'Emergency Preparedness Campaign',
      description: 'Educate families about emergency readiness',
      command: 'Create a comprehensive 7-day emergency preparedness campaign for families. Generate content for Instagram, Facebook, and our blog focusing on emergency planning, SOS device setup, and family safety protocols. Include practical tips, safety checklists, and real-world scenarios.'
    },
    {
      id: '2', 
      title: 'Family Safety Tips Series',
      description: 'Daily safety tips for families',
      command: 'Develop a 10-part family safety tips series covering personal safety, travel safety, and emergency response. Create engaging social media posts and detailed blog articles with SEO optimization for emergency safety keywords.'
    },
    {
      id: '3',
      title: 'Customer Testimonials Campaign',
      description: 'Real stories of how LifeLink Sync helped families',
      command: 'Generate 6 pieces of content featuring real customer testimonials about how LifeLink Sync helped in emergency situations. Create Instagram stories, Facebook posts, and email content highlighting peace of mind for families and life-saving features.'
    },
    {
      id: '4',
      title: 'SOS Feature Awareness Campaign',
      description: 'Highlight key app features and benefits',
      command: 'Create a feature-focused campaign showcasing LifeLink Sync capabilities. Generate 12 pieces of content including social posts, blog articles, and email sequences explaining emergency contacts, location sharing, family groups, and quick SOS activation.'
    },
    {
      id: '5',
      title: 'Senior Safety Initiative',
      description: 'Safety solutions for elderly users',
      command: 'Develop content specifically for seniors and their families about personal safety technology. Create 8 pieces including blog posts about aging safely, family communication, and how LifeLink Sync provides peace of mind for adult children.'
    }
  ];

  // Error boundary effect
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Riven AI Error:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Optimized data fetching with caching and error handling
  const { data: campaigns = [], loading: campaignsLoading, invalidate: invalidateCampaigns, error: campaignsError } = useOptimizedSupabaseQuery(
    'marketing_campaigns',
    '*',
    { 
      order: { column: 'created_at', ascending: false },
      limit: 50,
      cacheTime: 30000 // 30 seconds cache
    }
  );

  const { data: contents = [], loading: contentsLoading, invalidate: invalidateContents, error: contentsError } = useOptimizedSupabaseQuery(
    'marketing_content',
    '*',
    { 
      order: { column: 'created_at', ascending: false },
      limit: 100,
      cacheTime: 30000
    }
  );

  const { data: socialAccounts = [], loading: socialAccountsLoading, invalidate: invalidateSocialAccounts, error: socialAccountsError } = useOptimizedSupabaseQuery(
    'social_media_accounts',
    '*',
    { 
      order: { column: 'created_at', ascending: false },
      cacheTime: 60000 // Social accounts change less frequently
    }
  );

  // Batch query for additional data only when needed
  const additionalQueries = useMemo(() => [
    {
      key: 'pendingContent',
      fn: async () => {
        const { data } = await supabase
          .from('marketing_content')
          .select('id')
          .in('status', ['pending_review', 'draft']);
        return data?.length || 0;
      }
    },
    {
      key: 'connectedAccounts', 
      fn: async () => {
        const { data } = await supabase
          .from('social_media_oauth')
          .select('id')
          .eq('connection_status', 'connected');
        return data?.length || 0;
      }
    }
  ], []);

  const { data: metrics = {}, loading: metricsLoading } = useBatchQueries(additionalQueries);

  // Memoized computed values with proper null checks
  const stats = useMemo(() => {
    const campaignList = Array.isArray(campaigns) ? campaigns : [];
    const contentList = Array.isArray(contents) ? contents : [];
    const accountList = Array.isArray(socialAccounts) ? socialAccounts : [];
    
    return {
      totalCampaigns: campaignList.length,
      activeCampaigns: campaignList.filter((c: any) => ['running', 'active'].includes(c?.status)).length,
      completedCampaigns: campaignList.filter((c: any) => c?.status === 'completed').length,
      totalContent: contentList.length,
      publishedContent: contentList.filter((c: any) => c?.status === 'published').length,
      pendingContent: contentList.filter((c: any) => ['draft', 'pending'].includes(c?.status)).length,
      connectedAccounts: accountList.filter((a: any) => a?.connection_status === 'connected').length,
      totalAccounts: accountList.length,
      totalReach: metrics?.total_reach || 0,
      totalEngagement: metrics?.total_engagement || 0
    };
  }, [campaigns, contents, socialAccounts, metrics]);

  // Optimized event handlers
  const handleContentUpdate = useCallback(() => {
    invalidateContents();
    clearCache('marketing_content');
  }, [invalidateContents]);

  const handleCampaignUpdate = useCallback(() => {
    invalidateCampaigns();
    clearCache('marketing_campaigns');
  }, [invalidateCampaigns]);

  const handleAccountsUpdate = useCallback(() => {
    invalidateSocialAccounts();
    clearCache('social_media');
  }, [invalidateSocialAccounts]);

  const handleContentApproval = useCallback(async (contentId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: approved ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: approved ? "Content Approved" : "Content Rejected",
        description: `Content has been ${approved ? 'approved' : 'rejected'} successfully.`,
      });

      handleContentUpdate();
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content status",
        variant: "destructive"
      });
    }
  }, [toast, handleContentUpdate]);

  const handleDeleteContent = useCallback(async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content Deleted",
        description: "Content has been permanently deleted.",
      });

      handleContentUpdate();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  }, [toast, handleContentUpdate]);

  const handleEditContent = useCallback(async (contentId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content Updated",
        description: "Content has been successfully updated.",
      });

      handleContentUpdate();
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  }, [toast, handleContentUpdate]);

  const handlePublishContent = useCallback(async (contentId: string, options?: {
    platforms?: string[];
    publishType?: 'social' | 'blog' | 'email' | 'all';
    scheduledTime?: string;
  }) => {
    try {
      const { platforms = [], publishType = 'social', scheduledTime } = options || {};
      
      // Get content details
      const { data: content, error: fetchError } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (fetchError) throw fetchError;

      let publishResults: any[] = [];

      // Handle different publish types
      switch (publishType) {
        case 'social':
          const targetPlatforms = platforms.length > 0 ? platforms : [content.platform];
          
          for (const platform of targetPlatforms) {
            try {
              if (scheduledTime) {
                // Schedule for later
                await supabase
                  .from('social_media_posting_queue')
                  .insert({
                    content_id: contentId,
                    platform,
                    scheduled_time: scheduledTime,
                    status: 'scheduled'
                  });
                publishResults.push({ platform, success: true, scheduled: true });
              } else {
                // Publish immediately
                const { data, error } = await supabase.functions.invoke('posting-processor', {
                  body: { action: 'post_now', contentId, platform }
                });

                if (error) throw error;
                publishResults.push({ platform, success: true, data });
              }
            } catch (platformError) {
              console.error(`Error with ${platform}:`, platformError);
              publishResults.push({ platform, success: false, error: platformError.message });
            }
          }
          break;

        case 'blog':
          try {
            const { data, error } = await supabase.functions.invoke('blog-publisher', {
              body: { action: 'publish_blog', contentId }
            });
            
            if (error) throw error;
            publishResults.push({ type: 'blog', success: true, data });
          } catch (error) {
            publishResults.push({ type: 'blog', success: false, error: error.message });
          }
          break;

        case 'email':
          try {
            const { data, error } = await supabase.functions.invoke('email-publisher', {
              body: { 
                action: scheduledTime ? 'schedule_campaign' : 'send_campaign',
                contentId,
                campaignData: {
                  name: `Campaign: ${content.title}`,
                  subject: content.title,
                  scheduled_time: scheduledTime
                }
              }
            });
            
            if (error) throw error;
            publishResults.push({ type: 'email', success: true, data });
          } catch (error) {
            publishResults.push({ type: 'email', success: false, error: error.message });
          }
          break;

        case 'all':
          // Publish to blog first
          try {
            await supabase.functions.invoke('blog-publisher', {
              body: { action: 'publish_blog', contentId }
            });
            publishResults.push({ type: 'blog', success: true });
          } catch (error) {
            publishResults.push({ type: 'blog', success: false, error: error.message });
          }

          // Then social media
          const allPlatforms = platforms.length > 0 ? platforms : ['facebook', 'twitter', 'linkedin'];
          for (const platform of allPlatforms) {
            try {
              const { data, error } = await supabase.functions.invoke('posting-processor', {
                body: { action: 'post_now', contentId, platform }
              });
              if (error) throw error;
              publishResults.push({ platform, success: true, data });
            } catch (error) {
              publishResults.push({ platform, success: false, error: error.message });
            }
          }
          break;
      }

      // Update content status
      const successCount = publishResults.filter(r => r.success).length;
      if (successCount > 0) {
        await supabase
          .from('marketing_content')
          .update({ 
            status: scheduledTime ? 'scheduled' : 'published',
            posted_at: scheduledTime ? null : new Date().toISOString(),
            scheduled_time: scheduledTime || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', contentId);

        toast({
          title: scheduledTime ? "Content Scheduled" : "Publishing Complete",
          description: scheduledTime 
            ? `Content scheduled for ${new Date(scheduledTime).toLocaleString()}`
            : `Published successfully to ${successCount} destination(s)`,
        });
      } else {
        toast({
          title: "Publishing Failed",
          description: "Failed to publish content. Check your connections and try again.",
          variant: "destructive"
        });
      }

      handleContentUpdate();
    } catch (error) {
      console.error('Error in publish flow:', error);
      toast({
        title: "Error", 
        description: "Failed to publish content",
        variant: "destructive"
      });
    }
  }, [toast, handleContentUpdate]);

  // Command Center handlers
  const handleSendCommand = useCallback(async (config: any) => {
    setIsProcessing(true);
    setRivenResponse('');
    
    try {
      const response = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: {
          command: currentCommand,
          title: config?.title || `Marketing Campaign: ${currentCommand.substring(0, 50)}...`,
          settings: {
            word_count: config?.word_count || config?.wordCount || 900,
            content_depth: config?.content_depth || config?.contentDepth || 'high',
            seo_difficulty: config?.seo_difficulty || config?.seoDifficulty || 'medium'
          },
          scheduling_options: {
            mode: config?.scheduling_mode || config?.schedulingMode || 'spread',
            spread_days: config?.spread_days || config?.campaignDuration || 7,
            posts_per_day: config?.posts_per_day || config?.postsPerDay || 1,
            total_posts: config?.total_posts || config?.totalPosts || 3
          },
          publishing_controls: {
            platforms: config?.platforms || ['blog'],
            approval_required: config?.approval_required !== false
          }
        }
      });

      if (response.error) throw response.error;

      setRivenResponse(response.data?.message || 'Command processed successfully');
      
      toast({
        title: "Command Executed",
        description: "Content generation started. You'll be automatically taken to monitor progress.",
      });
      
      // Auto-navigate to monitor tab to track progress
      setActiveTab('monitor');
      
      // Start monitoring the campaign progress
      handleCampaignUpdate();
      handleContentUpdate();
      
      // Set up polling to check for completion and auto-navigate to approval
      const pollForCompletion = async () => {
        const campaignId = response.data?.campaign_id;
        if (!campaignId) return;
        
        const checkInterval = setInterval(async () => {
          try {
            const { data: campaign } = await supabase
              .from('marketing_campaigns')
              .select('status, completed_at')
              .eq('id', campaignId)
              .single();
              
            if (campaign?.status === 'completed') {
              clearInterval(checkInterval);
              // Wait a moment for content to be fully processed
              setTimeout(() => {
                setActiveTab('content-approval');
                toast({
                  title: "Content Ready!",
                  description: "Your blog post with image has been generated and is ready for approval.",
                });
                handleContentUpdate();
              }, 2000);
            } else if (campaign?.status === 'failed') {
              clearInterval(checkInterval);
              toast({
                title: "Generation Failed",
                description: "Content generation encountered an error. Please try again.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error checking campaign status:', error);
          }
        }, 3000); // Check every 3 seconds
        
        // Stop polling after 5 minutes to prevent infinite polling
        setTimeout(() => clearInterval(checkInterval), 300000);
      };
      
      pollForCompletion();
      
    } catch (error) {
      console.error('Error executing command:', error);
      setRivenResponse('Error: ' + (error as Error).message);
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, handleCampaignUpdate, handleContentUpdate, currentCommand, setActiveTab]);

  const handleUseTemplate = useCallback((template: any) => {
    setCurrentCommand(template.command);
  }, []);

  // Loading state and error checking
  const isLoading = campaignsLoading || contentsLoading || socialAccountsLoading || metricsLoading;
  const hasAnyError = hasError || campaignsError || contentsError || socialAccountsError;

  // Show error state if there are any errors
  if (hasAnyError) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Riven Marketing AI - Error Detected
            </CardTitle>
            <CardDescription>
              We've detected some issues that need to be resolved:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive">Application Error:</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            )}
            
            {campaignsError && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive">Campaigns Error:</p>
                <p className="text-sm text-muted-foreground">{campaignsError.message}</p>
              </div>
            )}
            
            {contentsError && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive">Content Error:</p>
                <p className="text-sm text-muted-foreground">{contentsError.message}</p>
              </div>
            )}
            
            {socialAccountsError && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive">Social Accounts Error:</p>
                <p className="text-sm text-muted-foreground">{socialAccountsError.message}</p>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Known Issues:</p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• OpenAI API quota has been exceeded - check your billing</li>
                <li>• Some database permissions may need to be configured</li>
                <li>• Edge functions may be experiencing connectivity issues</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-900">Quick Fixes:</p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                <li>• Check your OpenAI account billing and quota</li>
                <li>• Refresh the page to retry connections</li>
                <li>• Contact support if issues persist</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campaigns</p>
                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={stats.activeCampaigns > 0 ? "default" : "secondary"} className="text-xs">
                {stats.activeCampaigns} Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content</p>
                <p className="text-2xl font-bold">{stats.totalContent}</p>
              </div>
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={stats.pendingContent > 0 ? "destructive" : "secondary"} className="text-xs">
                {stats.pendingContent} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Social Accounts</p>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={stats.connectedAccounts > 0 ? "default" : "secondary"} className="text-xs">
                {stats.connectedAccounts} Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.publishedContent}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                This Month
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs with Lazy Loading */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="command-center" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Command Center
          </TabsTrigger>
          <TabsTrigger value="workflow-pipeline" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Creation Pipeline
          </TabsTrigger>
          <TabsTrigger value="content-approval" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Content Approval
          </TabsTrigger>
          <TabsTrigger value="social-hub" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social Hub
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="training-data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Training Data
          </TabsTrigger>
          <TabsTrigger value="riven-config" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Riven Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="command-center">
          <OptimizedComponentLoader
            type="command-center"
            props={{
              campaigns,
              onCampaignUpdate: handleCampaignUpdate,
              isLoading,
              commandTemplates,
              useTemplate: handleUseTemplate,
              currentCommand,
              setCurrentCommand,
              isProcessing,
              onSendCommand: handleSendCommand,
              rivenResponse,
              campaignId: (campaigns && campaigns.length > 0) ? campaigns[0]?.id : null,
              metrics: stats
            }}
          />
        </TabsContent>

        <TabsContent value="workflow-pipeline">
          <OptimizedComponentLoader
            type="workflow-pipeline"
            props={{
              campaignId: (campaigns && campaigns.length > 0) ? campaigns[0]?.id : null,
              isVisible: activeTab === 'workflow-pipeline'
            }}
          />
        </TabsContent>

        <TabsContent value="content-approval">
          <OptimizedComponentLoader
            type="content-approval"
            props={{
              contents,
              onContentUpdate: handleContentUpdate,
              onContentApproval: handleContentApproval,
              onPublishContent: handlePublishContent,
              onDeleteContent: handleDeleteContent,
              onEditContent: handleEditContent,
              isLoading: contentsLoading
            }}
          />
        </TabsContent>

        <TabsContent value="social-hub">
          <OptimizedComponentLoader
            type="social-hub"
            props={{
              socialAccounts,
              onAccountsUpdate: handleAccountsUpdate,
              isLoading: socialAccountsLoading
            }}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <OptimizedComponentLoader
            type="analytics"
            props={{
              campaigns,
              contents,
              socialAccounts,
              isLoading
            }}
          />
        </TabsContent>

        <TabsContent value="monitor">
          <OptimizedComponentLoader
            type="monitor"
            props={{
              campaigns,
              contents,
              socialAccounts,
              isLoading
            }}
          />
        </TabsContent>

        <TabsContent value="ai-settings">
          <OptimizedComponentLoader
            type="ai-settings"
            props={{}}
          />
        </TabsContent>

        <TabsContent value="training-data">
          <OptimizedComponentLoader
            type="training-data"
            props={{}}
          />
        </TabsContent>

        <TabsContent value="riven-config">
          <OptimizedComponentLoader
            type="riven-config"
            props={{}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}