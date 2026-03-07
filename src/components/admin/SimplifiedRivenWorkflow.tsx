import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Activity, Eye, CheckCircle, ArrowRight, XCircle, Clock, Send, Brain, AlertTriangle, RefreshCw, Play, Users, TrendingUp, Settings, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RealTimeWorkflowVisualizer } from './RealTimeWorkflowVisualizer';
import { ImageGenerationToggle } from './ImageGenerationToggle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BulkEmailCRM } from './BulkEmailCRM';
import { EmailCampaignControls } from './EmailCampaignControls';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { EmailAnalyticsDashboard } from './EmailAnalyticsDashboard';
import { SocialPostingStatus } from './SocialPostingStatus';

type WorkflowStage = 'command' | 'process' | 'approval' | 'success';

interface WorkflowStageData {
  id: string;
  campaign_id: string;
  stage_name: string;
  stage_order: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  output_data?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const SimplifiedRivenWorkflow: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStageData[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<ContentItem[]>([]);
  const [allPublishedContent, setAllPublishedContent] = useState<ContentItem[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<ContentItem[]>([]);
  const [publishedEmails, setPublishedEmails] = useState<ContentItem[]>([]);
  const [currentContentView, setCurrentContentView] = useState<'blogs' | 'emails' | 'bulk-crm' | 'analytics'>('blogs');
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('command');
  const [realTimeStages, setRealTimeStages] = useState<any[]>([]);
  const [apiProviderStatus, setApiProviderStatus] = useState<{ 
    openai: boolean; 
    xai: boolean; 
    openrouter: boolean; 
    fallbackUsed: boolean 
  }>({ openai: false, xai: false, openrouter: false, fallbackUsed: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState<string | null>(null);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    command: '',
    title: '',
    settings: {
      tone: 'professional',
      target_audience: 'families',
      content_type: 'blog_post',
      length: 'medium'
    },
    schedulingOptions: {
      publish_immediately: true,
      scheduled_time: null
    },
    publishingControls: {
      auto_publish: false,
      require_approval: true
    },
    imageGeneration: {
      enabled: false,
      customPrompt: '',
      style: 'professional'
    }
  });

  // Modal states
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  interface ContentItem {
    id: string;
    campaign_id: string;
    platform: string;
    content_type: string;
    title?: string;
    body_text?: string;
    seo_title?: string;
    meta_description?: string;
    image_url?: string;
    featured_image_alt?: string;
    hashtags?: string[];
    status: string;
    created_at: string;
    updated_at: string;
    keywords?: string[];
    seo_score?: number;
    reading_time?: number;
    content_sections?: any;
    posted_at?: string;
    email_metrics?: {
      total_sent: number;
      total_failed: number;
      total_opened: number;
      total_clicked: number;
      open_rate: number;
      click_rate: number;
      delivery_rate: number;
    };
  }

  const { toast } = useToast();

  // Check API provider status on mount
  useEffect(() => {
    const checkProviderStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('riven-marketing-enhanced', {
          body: { action: 'provider_status' }
        });
        
        if (data?.providers) {
          setApiProviderStatus({
            openai: data.providers.openai,
            xai: data.providers.xai,
            openrouter: data.providers.openrouter,
            fallbackUsed: !data.providers.openai && !data.providers.xai && !data.providers.openrouter
          });
          
          if (!data.providers.openai && !data.providers.xai && !data.providers.openrouter) {
            toast({
              title: "API Provider Warning",
              description: "No AI providers are configured. Please configure AI providers for content generation.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Failed to check provider status:', error);
      }
    };
    
    checkProviderStatus();
    loadAllPublishedContent();
  }, []);

  // Load all published content for the Published stage
  const loadAllPublishedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('status', 'published')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setAllPublishedContent(data || []);
      
      // Separate blogs and emails with strict filtering
      const blogs = data?.filter(item => 
        item.content_type === 'blog_post' && 
        item.platform !== 'email'
      ) || [];
      const emails = data?.filter(item => 
        item.content_type === 'email_campaign' || 
        item.platform === 'email'
      ) || [];
      
      setPublishedBlogs(blogs);
      setPublishedEmails(emails);
    } catch (error) {
      console.error('Error loading published content:', error);
    }
  };

  // Load published blogs only
  const loadPublishedBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('status', 'published')
        .eq('content_type', 'blog_post')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      
      // Strict filtering to ensure ONLY blog content
      const blogContent = (data || []).filter(item => 
        item.content_type === 'blog_post' && 
        item.platform !== 'email'
      );
      
      console.log('Loaded published blogs:', blogContent.length, 'items');
      setPublishedBlogs(blogContent);
    } catch (error) {
      console.error('Error loading published blogs:', error);
    }
  };

  // Load published emails only
  const loadPublishedEmails = async () => {
    try {
      // Load email campaigns directly from marketing_content
      const { data: emailCampaigns, error: campaignError } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('content_type', 'email_campaign')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      // Get email queue statistics for metrics (separate query to avoid join issues)
      const { data: queueStats, error: statsError } = await supabase
        .from('email_queue')
        .select('status, sent_at, created_at, campaign_id')
        .order('created_at', { ascending: false });

      if (statsError) {
        console.warn('Could not load email queue stats:', statsError);
      }

      // Enrich email campaigns with metrics if available
      const enrichedEmailCampaigns = (emailCampaigns || []).map(campaign => {
        if (queueStats) {
          const campaignEmails = queueStats.filter(email => email.campaign_id === campaign.id);
          const emailMetrics = {
            total_sent: campaignEmails.filter(email => email.status === 'sent').length,
            total_failed: campaignEmails.filter(email => email.status === 'failed').length,
            total_opened: 0, // These would come from a different table in a real implementation
            total_clicked: 0,
            open_rate: 0,
            click_rate: 0,
            delivery_rate: campaignEmails.length > 0 ? 
              (campaignEmails.filter(email => email.status === 'sent').length / campaignEmails.length) * 100 : 0
          };
          return { ...campaign, email_metrics: emailMetrics };
        }
        return campaign;
      });

      setPublishedEmails(enrichedEmailCampaigns);
      console.log('Loaded published emails:', enrichedEmailCampaigns.length, 'campaigns');
      
    } catch (error) {
      console.error('Error loading published emails:', error);
    }
  };

  // Real-time subscription for workflow stages
  useEffect(() => {
    if (!currentCampaignId) return;

    const channel = supabase
      .channel(`workflow-stages-${currentCampaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_stages',
          filter: `campaign_id=eq.${currentCampaignId}`
        },
        (payload) => {
          console.log('Real-time workflow stage update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setRealTimeStages(prev => {
              const updated = [...prev];
              const index = updated.findIndex(stage => stage.stage_name === payload.new.stage_name);
              
              if (index >= 0) {
                updated[index] = payload.new;
              } else {
                updated.push(payload.new);
              }
              
              // Sort by stage order
              return updated.sort((a, b) => a.stage_order - b.stage_order);
            });
            
            // Update processing status based on stages
            const allStagesCompleted = payload.new.status === 'completed' && 
              realTimeStages.filter(s => s.status === 'completed').length >= 4;
            
            if (allStagesCompleted) {
              setIsProcessing(false);
              setCurrentStage('approval');
              loadContentItems();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCampaignId, realTimeStages]);

  // Load content items from database
  const loadContentItems = async () => {
    if (!currentCampaignId) return;

    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('campaign_id', currentCampaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGeneratedContent(data || []);
      
      // Auto-move to approval stage if content exists
      if (data && data.length > 0 && currentStage === 'process') {
        setCurrentStage('approval');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error loading content items:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load content items",
        variant: "destructive"
      });
    }
  };

  // Load content items when campaign ID changes
  useEffect(() => {
    if (currentCampaignId) {
      loadContentItems();
    }
  }, [currentCampaignId]);

  const handleSubmit = async () => {
    if (!formData.command.trim()) {
      toast({
        title: "Command Required",
        description: "Please enter a marketing command to proceed.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStage('process');
    setCurrentStep(0);
    setRealTimeStages([]);

    try {
      const { data: campaignData, error: campaignError } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: {
          command: formData.command,
          title: formData.title,
          settings: formData.settings,
          scheduling_options: formData.schedulingOptions,
          publishing_controls: formData.publishingControls,
          image_generation: formData.imageGeneration.enabled,
          image_prompt: formData.imageGeneration.customPrompt,
          image_style: formData.imageGeneration.style
        }
      });

      if (campaignError) {
        throw new Error(campaignError.message || 'Failed to start campaign');
      }

      if (campaignData?.campaignId) {
        setCurrentCampaignId(campaignData.campaignId);
        setRealTimeStages([]); // Reset stages for new campaign
        // Start monitoring real-time stages immediately
        monitorWorkflowProgress(campaignData.campaignId);
      }

      toast({
        title: "Campaign Started",
        description: "Your AI marketing campaign is now processing...",
      });

    } catch (error) {
      console.error('Error starting campaign:', error);
      setIsProcessing(false);
      setCurrentStage('command');
      
      toast({
        title: "Campaign Failed",
        description: error instanceof Error ? error.message : 'Failed to start campaign',
        variant: "destructive"
      });
    }
  };

  const monitorWorkflowProgress = async (campaignId: string) => {
    // This function can be used for additional monitoring if needed
    console.log('Monitoring workflow progress for campaign:', campaignId);
  };

  const handleApproval = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ status: 'approved' })
        .eq('id', contentId);

      if (error) throw error;

      // Update local state
      setGeneratedContent(prev => 
        prev.map(item => 
          item.id === contentId ? { ...item, status: 'approved' } : item
        )
      );
      
      // Reload content to sync
      await loadContentItems();
      
      toast({
        title: "Content Approved",
        description: "Content has been approved and is ready for publishing.",
      });
    } catch (error) {
      console.error('Error approving content:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'published',
          posted_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;

      // Update local state
      setGeneratedContent(prev => 
        prev.map(item => 
          item.id === contentId ? { ...item, status: 'published', posted_at: new Date().toISOString() } : item
        )
      );
      
      // Move to success stage if any content is published
      setCurrentStage('success');
      
      // Reload content to sync
      await loadContentItems();
      await loadAllPublishedContent(); // Refresh published content list
      
      // Refresh the specific content view
      if (currentContentView === 'blogs') {
        await loadPublishedBlogs();
      } else {
        await loadPublishedEmails();
      }
      
      // Auto-queue social posts for connected platforms (non-blocking)
      let socialQueueWarning = "";
      try {
        console.log('[handlePublish] Fetching connected social platforms...');
        
        // Fetch connected platforms (status = 'connected' or 'active')
        const { data: connectedPlatforms, error: platformError } = await supabase
          .from('social_media_oauth')
          .select('platform')
          .in('connection_status', ['connected', 'active']);
        
        if (platformError) {
          console.warn('[handlePublish] Failed to fetch platforms:', platformError);
          socialQueueWarning = "Published but could not check social platforms";
        } else if (connectedPlatforms && connectedPlatforms.length > 0) {
          console.log('[handlePublish] Found connected platforms:', connectedPlatforms.map(p => p.platform));
          
          // Build queue inserts for each platform
          const nowISO = new Date().toISOString();
          const queueInserts = connectedPlatforms.map(p => ({
            content_id: contentId,
            platform: p.platform,
            status: 'queued',
            scheduled_time: nowISO,
            retry_count: 0,
            max_retries: 3
          }));
          
          console.log('[handlePublish] Inserting into social_media_posting_queue:', queueInserts.length, 'rows');
          
          const { error: queueError } = await supabase
            .from('social_media_posting_queue')
            .insert(queueInserts);
          
          if (queueError) {
            console.error('[handlePublish] Queue insert failed:', queueError);
            socialQueueWarning = `Published but social queue failed: ${queueError.message}`;
          } else {
            console.log('[handlePublish] Successfully queued for', connectedPlatforms.length, 'platform(s)');
          }
        } else {
          console.log('[handlePublish] No connected social platforms found');
        }
      } catch (socialError) {
        console.error('[handlePublish] Social queue error (non-blocking):', socialError);
        socialQueueWarning = `Published but social queue failed: ${socialError instanceof Error ? socialError.message : 'Unknown error'}`;
      }
      
      // Show success toast (always)
      toast({
        title: "Content Published",
        description: "Content has been successfully published!",
      });
      
      // Show warning toast if queue failed (non-blocking)
      if (socialQueueWarning) {
        toast({
          title: "Social Queue Warning",
          description: socialQueueWarning,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (contentId: string) => {
    try {
      // Delete the rejected content entirely
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Update local state by removing the content
      setGeneratedContent(prev => prev.filter(item => item.id !== contentId));
      
      toast({
        title: "Content Deleted",
        description: "Rejected content has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting rejected content:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete content. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Modal handlers
  const handlePreviewContent = (content: ContentItem) => {
    setSelectedContent(content);
    setShowPreviewModal(true);
  };

  const handleEditContent = (content: ContentItem) => {
    setSelectedContent(content);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedContent: ContentItem) => {
    try {
      // Update database first
      const { error } = await supabase
        .from('marketing_content')
        .update({
          title: updatedContent.title,
          body_text: updatedContent.body_text,
          seo_title: updatedContent.seo_title,
          meta_description: updatedContent.meta_description,
          keywords: updatedContent.keywords,
          image_url: updatedContent.image_url,
          featured_image_alt: updatedContent.featured_image_alt,
          seo_score: updatedContent.seo_score
        })
        .eq('id', updatedContent.id);

      if (error) throw error;

      // Update local state
      setGeneratedContent(prev => 
        prev.map(item => 
          item.id === updatedContent.id ? updatedContent : item
        )
      );
      
      // Reload content from database to sync
      await loadContentItems();
      
      toast({
        title: "Content Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setSelectedContent(null);
    setShowEditModal(false);
  };

  // Handle deleting published content
  const handleDeleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Update local state
      setAllPublishedContent(prev => prev.filter(content => content.id !== contentId));
      setPublishedBlogs(prev => prev.filter(content => content.id !== contentId));
      setPublishedEmails(prev => prev.filter(content => content.id !== contentId));
      setGeneratedContent(prev => prev.filter(content => content.id !== contentId));
      setShowDeleteConfirm(null);

      toast({
        title: "Content Deleted",
        description: "Content has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle creating new content manually
  const handleCreateNewContent = () => {
    setCurrentStage('command');
    resetWorkflow();
  };

  const handleRegenerateContent = async (contentId: string) => {
    try {
      const content = generatedContent.find(item => item.id === contentId);
      if (!content) return;

      // Delete the current content
      const { error: deleteError } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', contentId);

      if (deleteError) throw deleteError;

      // Update local state by removing the content
      setGeneratedContent(prev => prev.filter(item => item.id !== contentId));

      // Generate new content with custom instructions
      setIsProcessing(true);
      setCurrentStage('process');

      const customCommand = regenerateInstructions.trim() 
        ? `${formData.command}\n\nAdditional instructions: ${regenerateInstructions}`
        : formData.command;

      const { data: campaignData, error: campaignError } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: {
          command: customCommand,
          title: formData.title,
          settings: formData.settings,
          scheduling_options: formData.schedulingOptions,
          publishing_controls: formData.publishingControls,
          image_generation: formData.imageGeneration.enabled,
          image_prompt: formData.imageGeneration.customPrompt,
          image_style: formData.imageGeneration.style
        }
      });

      if (campaignError) {
        throw new Error(campaignError.message || 'Failed to regenerate content');
      }

      if (campaignData?.campaignId) {
        setCurrentCampaignId(campaignData.campaignId);
        setRealTimeStages([]);
        monitorWorkflowProgress(campaignData.campaignId);
      }

      // Reset dialog state
      setShowRegenerateDialog(null);
      setRegenerateInstructions('');
      
      toast({
        title: "Content Regenerating",
        description: "New content is being generated with your instructions...",
      });

    } catch (error) {
      console.error('Error regenerating content:', error);
      setIsProcessing(false);
      setCurrentStage('approval');
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive"
      });
    }
  };


  const resetWorkflow = () => {
    setCurrentStage('command');
    setIsProcessing(false);
    setCurrentStep(0);
    setCurrentCampaignId(null);
    setGeneratedContent([]);
    setRealTimeStages([]);
    setFormData({
      command: '',
      title: '',
      settings: {
        tone: 'professional',
        target_audience: 'families',
        content_type: 'blog_post',
        length: 'medium'
      },
      schedulingOptions: {
        publish_immediately: true,
        scheduled_time: null
      },
      publishingControls: {
        auto_publish: false,
        require_approval: true
      },
      imageGeneration: {
        enabled: false,
        customPrompt: '',
        style: 'professional'
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 overflow-x-hidden">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Riven AI Marketing System</h1>
        <p className="text-muted-foreground text-base md:text-lg mb-4">
          Advanced AI-powered content creation and marketing automation
        </p>
        
        {/* Quick Access to Published Content */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStage('success');
              setCurrentContentView('blogs');
              loadPublishedBlogs();
            }}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Published Blogs
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStage('success');
              setCurrentContentView('emails');
              loadPublishedEmails();
            }}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Published Emails
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStage('success');
              setCurrentContentView('bulk-crm');
            }}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Bulk Email CRM
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStage('success');
              setCurrentContentView('analytics');
            }}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Email Analytics
          </Button>
          
          <Button
            variant="outline" 
            onClick={() => setCurrentStage('command')}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Create New Content
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Marketing Workflow Control
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant={isProcessing ? "secondary" : "outline"}>
                {isProcessing ? "Processing" : "Ready"}
              </Badge>
            </div>
            
            {/* Stage Navigation */}
            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              {[
                { id: 'command', label: 'Command Centre', icon: Wand2 },
                { id: 'process', label: 'AI Processing', icon: Activity },
                { id: 'approval', label: 'Review & Approve', icon: Eye },
                { id: 'success', label: 'Published Content', icon: CheckCircle }
              ].map((stage, index) => {
                const StageIcon = stage.icon;
                const isActive = currentStage === stage.id;
                const isCompleted = ['command', 'process', 'approval', 'success'].indexOf(currentStage) > index;
                const isClickable = stage.id === 'command' || 
                  stage.id === 'success' || // Always allow access to published content
                  (stage.id === 'approval' && generatedContent.length > 0) ||
                  (stage.id === 'process' && isProcessing);
                
                return (
                  <div key={stage.id} className="flex items-center flex-shrink-0">
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        if (isClickable) {
                          setCurrentStage(stage.id as WorkflowStage);
                          if (stage.id === 'success') {
                            // Load content based on current view
                            if (currentContentView === 'blogs') {
                              loadPublishedBlogs();
                            } else {
                              loadPublishedEmails();
                            }
                          }
                        }
                      }}
                      disabled={!isClickable}
                      className={`flex items-center gap-1 md:gap-2 transition-all text-xs md:text-sm ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : isClickable
                          ? 'text-foreground hover:bg-accent'
                          : 'text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                    >
                      <StageIcon className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="text-xs md:text-sm font-medium whitespace-nowrap">{stage.label}</span>
                    </Button>
                    {index < 3 && (
                      <ArrowRight className="h-3 w-3 md:h-4 md:w-4 mx-1 md:mx-2 text-muted-foreground hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {currentStage === 'command' && (
            <div className="space-y-6">
              {/* AI Provider Status */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5 text-primary" />
                      AI Marketing Command
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {apiProviderStatus.openai && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">OpenAI Active</Badge>
                      )}
                      {apiProviderStatus.xai && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">xAI Active</Badge>
                      )}
                      {apiProviderStatus.openrouter && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">OpenRouter Active</Badge>
                      )}
                      {apiProviderStatus.fallbackUsed && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">No AI Providers</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const checkProviderStatus = async () => {
                            try {
                              const { data } = await supabase.functions.invoke('riven-marketing-enhanced', {
                                body: { action: 'provider_status' }
                              });
                              if (data?.providers) {
                                setApiProviderStatus({
                                  openai: data.providers.openai,
                                  xai: data.providers.xai,
                                  openrouter: data.providers.openrouter,
                                  fallbackUsed: !data.providers.openai && !data.providers.xai && !data.providers.openrouter
                                });
                              }
                            } catch (error) {
                              console.error('Failed to check provider status:', error);
                            }
                          };
                          checkProviderStatus();
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiProviderStatus.fallbackUsed && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        No AI providers are configured. Please configure OpenAI, xAI, or OpenRouter to enable content generation.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Marketing Command
                    </label>
                    <Textarea
                      placeholder="Describe what content you want to create. Be specific about topic, audience, and format."
                      value={formData.command}
                      onChange={(e) => setFormData({...formData, command: e.target.value})}
                      className="min-h-[100px]"
                      disabled={isProcessing}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Provide detailed instructions for content creation including topic, target audience, tone, and format requirements.
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Campaign Title
                    </label>
                    <Input
                      placeholder="Campaign title (optional)"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Content Tone
                    </label>
                    <Select 
                      value={formData.settings.tone} 
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        settings: {...formData.settings, tone: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target Audience
                    </label>
                    <Select 
                      value={formData.settings.target_audience} 
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        settings: {...formData.settings, target_audience: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="families">Families</SelectItem>
                        <SelectItem value="seniors">Senior Citizens</SelectItem>
                        <SelectItem value="professionals">Working Professionals</SelectItem>
                        <SelectItem value="travelers">Frequent Travelers</SelectItem>
                        <SelectItem value="general">General Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Content Type
                    </label>
                    <Select 
                      value={formData.settings.content_type} 
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        settings: {...formData.settings, content_type: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog_post">Blog Post</SelectItem>
                        <SelectItem value="social_post">Social Media Post</SelectItem>
                        <SelectItem value="email_campaign">Email Campaign</SelectItem>
                        <SelectItem value="video_script">Video Script</SelectItem>
                        <SelectItem value="press_release">Press Release</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Image Generation Section */}
              <div className="space-y-4">
                <ImageGenerationToggle
                  enabled={formData.imageGeneration.enabled}
                  onToggle={(enabled) => setFormData({
                    ...formData,
                    imageGeneration: { ...formData.imageGeneration, enabled }
                  })}
                  customPrompt={formData.imageGeneration.customPrompt}
                  onPromptChange={(prompt) => setFormData({
                    ...formData,
                    imageGeneration: { ...formData.imageGeneration, customPrompt: prompt }
                  })}
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Ready to create AI-powered marketing content
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.command.trim() || isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Launch AI Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStage === 'process' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Activity className="h-6 w-6 text-primary animate-pulse" />
                  <h3 className="text-xl font-semibold">AI Processing Your Content</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Our AI is analyzing your command and generating high-quality content{formData.imageGeneration.enabled ? ' with custom images' : ''}...
                </p>
                
                {/* Image Generation Status */}
                {formData.imageGeneration.enabled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-sm font-medium">AI Image Generation Active</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      Creating custom image: "{formData.imageGeneration.customPrompt?.substring(0, 60)}..."
                    </p>
                  </div>
                )}
                
                {/* API Provider Status */}
                <div className="flex justify-center gap-4 mb-6">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    apiProviderStatus.openai ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${apiProviderStatus.openai ? 'bg-green-500' : 'bg-red-500'}`} />
                    OpenAI {apiProviderStatus.openai ? 'Connected' : 'Unavailable'}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    apiProviderStatus.xai ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${apiProviderStatus.xai ? 'bg-green-500' : 'bg-red-500'}`} />
                    xAI {apiProviderStatus.xai ? 'Connected' : 'Unavailable'}
                  </div>
                </div>
              </div>

              {/* Enhanced Real-Time Progress */}
              <div className="space-y-4">
                {realTimeStages.length > 0 ? (
                  realTimeStages.map((stage, index) => (
                    <div key={stage.stage_name} className="bg-card rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {stage.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : stage.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : stage.status === 'in_progress' ? (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="font-medium capitalize">
                            {stage.stage_name.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant={
                          stage.status === 'completed' ? 'default' :
                          stage.status === 'failed' ? 'destructive' :
                          stage.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {stage.status}
                        </Badge>
                      </div>
                      
                      {stage.started_at && (
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(stage.started_at).toLocaleTimeString()}
                          {stage.completed_at && (
                            <span className="ml-4">
                              Completed: {new Date(stage.completed_at).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {stage.error_message && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          Error: {stage.error_message}
                        </div>
                      )}
                      
                      {stage.output_data && Object.keys(stage.output_data).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <details className="cursor-pointer">
                            <summary>Stage Output</summary>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(stage.output_data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <RealTimeWorkflowVisualizer 
                    campaignId={currentCampaignId || ''}
                    workflow={workflowStages}
                  />
                )}
              </div>
              
              {isProcessing && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      Processing {realTimeStages.find(s => s.status === 'in_progress')?.stage_name?.replace('_', ' ') || 'workflow'}...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStage === 'approval' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Review & Approve Content</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Review the AI-generated content and approve it for publishing
                </p>
                
                {/* Workflow Guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <h4 className="font-semibold text-blue-800 mb-2">Publishing Workflow:</h4>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span className="bg-white px-2 py-1 rounded font-medium">1. Review</span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="bg-white px-2 py-1 rounded font-medium">2. Approve</span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="bg-white px-2 py-1 rounded font-medium">3. Publish Live</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    After approval, click "Publish to Live" to make content visible on your blog.
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                {generatedContent.length > 0 ? (
                  generatedContent.map((content) => (
                    <Card key={content.id} className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{content.title || 'Untitled Content'}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={content.status === 'approved' ? 'default' : 'secondary'}>
                              {content.status}
                            </Badge>
                            <Badge variant="outline">
                              {content.content_type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {content.meta_description && (
                            <p className="text-sm text-muted-foreground">
                              {content.meta_description}
                            </p>
                          )}

                          {/* Generated Image Display */}
                          {content.image_url && (
                            <div className="rounded-lg border bg-muted/30 p-4">
                              <div className="flex items-center gap-4">
                                <div className="aspect-video w-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                                  <img 
                                    src={content.image_url} 
                                    alt={content.featured_image_alt || "Generated content image"}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden flex-col items-center justify-center w-full h-full">
                                    📸 Generated Image
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    🎨 AI Generated Image
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      Ready
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {content.featured_image_alt || "Custom generated image for this content"}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mt-2 h-6 px-2 text-xs"
                                    onClick={() => window.open(content.image_url, '_blank')}
                                  >
                                    View Full Size
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {content.reading_time && (
                              <div>
                                <span className="font-medium">Reading Time:</span>
                                <div>{content.reading_time} min</div>
                              </div>
                            )}
                            {content.seo_score && (
                              <div>
                                <span className="font-medium">SEO Score:</span>
                                <div>{content.seo_score}/100</div>
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Platform:</span>
                              <div className="capitalize">{content.platform}</div>
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>
                              <div>{new Date(content.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewContent(content)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditContent(content)}
                            >
                              Edit
                            </Button>

                            {content.status === 'draft' && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleApproval(content.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve for Publishing
                              </Button>
                            )}

                            {content.status === 'approved' && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handlePublish(content.id)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Publish to Live
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(content.id)}
                            >
                              Reject
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRegenerateDialog(content.id)}
                            >
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      No content generated yet. Try running the AI processing again.
                    </div>
                    <Button variant="outline" onClick={() => setCurrentStage('command')}>
                      Return to Command Centre
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStage === 'success' && (
            <div className="space-y-6">
              {/* Header with manual test button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Published Content</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      toast({ title: "Running Social Poster...", description: "Processing queue..." });
                      const { data, error } = await supabase.functions.invoke('posting-processor', { body: {} });
                      if (error) throw error;
                      toast({
                        title: "Social Poster Complete",
                        description: `Processed: ${data?.processed ?? 0}, Succeeded: ${data?.succeeded ?? 0}, Failed: ${data?.failed ?? 0}`,
                      });
                    } catch (err) {
                      console.error('[RunSocialPoster]', err);
                      toast({
                        title: "Social Poster Failed",
                        description: err instanceof Error ? err.message : 'Unknown error',
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Run Social Poster Now
                </Button>
              </div>
              {/* Content View Tabs */}
              <div className="flex gap-2 border-b">
                <Button 
                  variant={currentContentView === 'blogs' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentContentView('blogs'); loadPublishedBlogs(); }}
                  className="rounded-none border-b-2 border-transparent hover:border-primary"
                >
                  Blog Posts
                </Button>
                <Button 
                  variant={currentContentView === 'emails' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentContentView('emails'); loadPublishedEmails(); }}
                  className="rounded-none border-b-2 border-transparent hover:border-primary"
                >
                  Email Campaigns
                </Button>
                <Button 
                  variant={currentContentView === 'bulk-crm' ? 'default' : 'ghost'}
                  onClick={() => setCurrentContentView('bulk-crm')}
                  className="rounded-none border-b-2 border-transparent hover:border-primary"
                >
                  Bulk CRM
                </Button>
                <Button 
                  variant={currentContentView === 'analytics' ? 'default' : 'ghost'}
                  onClick={() => setCurrentContentView('analytics')}
                  className="rounded-none border-b-2 border-transparent hover:border-primary"
                >
                  Analytics
                </Button>
              </div>

              {/* Content Area */}
              {currentContentView === 'bulk-crm' && <BulkEmailCRM />}
              {currentContentView === 'analytics' && <EmailAnalyticsDashboard />}
              {(currentContentView === 'blogs' || currentContentView === 'emails') && (
                <div className="space-y-4">
                  {(currentContentView === 'blogs' ? publishedBlogs : publishedEmails).length > 0 ? (
                    <div className="grid gap-4">
                      {(currentContentView === 'blogs' ? publishedBlogs : publishedEmails).map((item) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.content_type === 'email_campaign' ? 'Email Campaign' : 'Blog Post'} • 
                                Published {new Date(item.posted_at || item.created_at).toLocaleDateString()}
                              </p>
                              {item.email_metrics && (
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Sent: {item.email_metrics.total_sent}</span>
                                  <span>Opens: {item.email_metrics.total_opened} ({item.email_metrics.open_rate}%)</span>
                                  <span>Clicks: {item.email_metrics.total_clicked} ({item.email_metrics.click_rate}%)</span>
                                </div>
                              )}
                              {/* Social Media Posting Status */}
                              <SocialPostingStatus contentId={item.id} />
                            </div>
                             <div className="flex gap-2">
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => { setSelectedContent(item); setShowPreviewModal(true); }}
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="destructive"
                                 onClick={() => setShowDeleteConfirm(item.id)}
                                 className="text-white hover:bg-red-600"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                               {item.content_type === 'email_campaign' && (
                                 <>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => { setSelectedContent(item); setShowTemplateEditor(true); }}
                                   >
                                     <Settings className="h-4 w-4" />
                                   </Button>
                                   <EmailCampaignControls 
                                     contentItem={item}
                                     onCampaignCreated={(campaignId) => {
                                       toast({
                                         title: "Campaign Created",
                                         description: `Campaign ${campaignId} has been created.`
                                       });
                                     }}
                                     onEmailsQueued={(count) => {
                                       toast({
                                         title: "Emails Queued",
                                         description: `${count} emails have been queued for sending.`
                                       });
                                     }}
                                   />
                                 </>
                               )}
                             </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No {currentContentView === 'blogs' ? 'published blog posts' : 'email campaigns'} found.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Professional Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-bold text-foreground">
                  {selectedContent?.title || 'Content Preview'}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Preview the generated content before approving for publication.
                </DialogDescription>
                {selectedContent && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {selectedContent.platform}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {selectedContent.content_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {selectedContent.reading_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedContent.reading_time} min read
                      </span>
                    )}
                    {selectedContent.seo_score && (
                      <span className="flex items-center gap-1">
                        📈 SEO Score: {selectedContent.seo_score}/100
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6">
              {selectedContent?.body_text ? (
                <article className="max-w-none">
                  {/* Featured Image */}
                  {selectedContent.image_url && (
                    <div className="mb-8">
                      <img 
                        src={selectedContent.image_url} 
                        alt={selectedContent.featured_image_alt || selectedContent.title || 'Featured image'} 
                        className="w-full h-64 object-cover rounded-lg border shadow-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {selectedContent.featured_image_alt && (
                        <p className="text-xs text-muted-foreground mt-2 italic text-center">
                          {selectedContent.featured_image_alt}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Professional article styling */}
                  <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-headings:font-bold prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
                    <div 
                      className="formatted-content space-y-6"
                      dangerouslySetInnerHTML={{ __html: selectedContent.body_text }} 
                    />
                  </div>
                  
                  {/* Content metadata */}
                  {(selectedContent.keywords || selectedContent.hashtags) && (
                    <div className="mt-12 pt-8 border-t border-border">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Content Tags</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedContent.keywords && selectedContent.keywords.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              🔍 Keywords
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedContent.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              # Hashtags
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedContent.hashtags.map((hashtag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  #{hashtag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* SEO Information */}
                  {(selectedContent.seo_title || selectedContent.meta_description) && (
                    <div className="mt-8 pt-8 border-t border-border">
                      <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        🎯 SEO Optimization
                      </h4>
                      <div className="space-y-4">
                        {selectedContent.seo_title && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">SEO Title</label>
                            <div className="text-sm text-foreground p-3 bg-muted rounded-lg border">
                              {selectedContent.seo_title}
                            </div>
                          </div>
                        )}
                        {selectedContent.meta_description && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                            <div className="text-sm text-foreground p-3 bg-muted rounded-lg border">
                              {selectedContent.meta_description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Statistics */}
                  <div className="mt-8 pt-8 border-t border-border">
                    <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      📊 Content Statistics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedContent.reading_time && (
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-semibold text-foreground">{selectedContent.reading_time}</div>
                          <div className="text-xs text-muted-foreground">Minutes</div>
                        </div>
                      )}
                      {selectedContent.seo_score && (
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-semibold text-foreground">{selectedContent.seo_score}/100</div>
                          <div className="text-xs text-muted-foreground">SEO Score</div>
                        </div>
                      )}
                      {selectedContent.keywords && (
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-semibold text-foreground">{selectedContent.keywords.length}</div>
                          <div className="text-xs text-muted-foreground">Keywords</div>
                        </div>
                      )}
                      {selectedContent.hashtags && (
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-semibold text-foreground">{selectedContent.hashtags.length}</div>
                          <div className="text-xs text-muted-foreground">Hashtags</div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground text-lg">No content body available for preview.</div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t pt-4 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                {selectedContent && (
                  <>Created: {new Date(selectedContent.created_at).toLocaleString()}</>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Close Preview
                </Button>
                {selectedContent && (
                  <Button onClick={() => { setShowPreviewModal(false); setShowEditModal(true); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Edit Content
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>Make quick edits and save your changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={selectedContent?.title || ''}
              onChange={(e) => setSelectedContent(prev => prev ? { ...prev, title: e.target.value } : prev)}
              placeholder="Title"
            />
            <Textarea
              className="min-h-[300px]"
              value={selectedContent?.body_text || ''}
              onChange={(e) => setSelectedContent(prev => prev ? { ...prev, body_text: e.target.value } : prev)}
              placeholder="Body (HTML supported)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            {selectedContent && (
              <Button onClick={() => { handleSaveEdit(selectedContent); setShowEditModal(false); }}>
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteConfirm && handleDeleteContent(showDeleteConfirm)}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={!!showRegenerateDialog} onOpenChange={() => setShowRegenerateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Content</DialogTitle>
            <DialogDescription>
              Provide specific instructions for what you'd like changed in the regenerated content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Specify what changes you want made to the content, tone, format, or focus areas."
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => showRegenerateDialog && handleRegenerateContent(showRegenerateDialog)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Regenerate Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Template Editor Dialog */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Template Editor</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <EmailTemplateEditor
              content={selectedContent}
              onSave={() => setShowTemplateEditor(false)}
              onSend={() => setShowTemplateEditor(false)}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};