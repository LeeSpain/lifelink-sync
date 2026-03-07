import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStage {
  id: string;
  campaign_id: string;
  stage_name: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  output_data?: any;
  error_message?: string;
}

interface Campaign {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  priority?: string;
}

interface MarketingContent {
  id: string;
  campaign_id: string;
  platform: string;
  content_type: string;
  title?: string;
  body_text?: string;
  image_url?: string;
  status: string;
  hashtags?: string[];
  seo_title?: string;
  meta_description?: string;
  keywords?: string[];
  created_at: string;
  updated_at: string;
}

interface WorkflowState {
  campaigns: Campaign[];
  activeWorkflows: Record<string, WorkflowStage[]>;
  contentItems: MarketingContent[];
  currentCampaignId?: string;
  activeTab: string;
  isRealTimeConnected: boolean;
  processingStage?: string;
  livePreview?: any;
  workflowQueue: Campaign[];
  estimatedTimeRemaining?: number;
  notifications: Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  analytics: {
    totalCampaigns: number;
    completionRate: number;
    averageTime: number;
    activeAgents: number;
  };
}

type WorkflowAction =
  | { type: 'SET_CAMPAIGNS'; payload: Campaign[] }
  | { type: 'UPDATE_CAMPAIGN'; payload: Campaign }
  | { type: 'SET_WORKFLOW_STAGES'; payload: { campaignId: string; stages: WorkflowStage[] } }
  | { type: 'UPDATE_WORKFLOW_STAGE'; payload: WorkflowStage }
  | { type: 'SET_CONTENT_ITEMS'; payload: MarketingContent[] }
  | { type: 'ADD_CONTENT_ITEM'; payload: MarketingContent }
  | { type: 'UPDATE_CONTENT_ITEM'; payload: MarketingContent }
  | { type: 'SET_CURRENT_CAMPAIGN'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_REALTIME_STATUS'; payload: boolean }
  | { type: 'SET_PROCESSING_STAGE'; payload: string | undefined }
  | { type: 'SET_LIVE_PREVIEW'; payload: any }
  | { type: 'ADD_TO_QUEUE'; payload: Campaign }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'SET_ESTIMATED_TIME'; payload: number }
  | { type: 'ADD_NOTIFICATION'; payload: { id: string; type: 'success' | 'info' | 'warning' | 'error'; title: string; message: string; timestamp: string; read: boolean } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'UPDATE_ANALYTICS'; payload: Partial<WorkflowState['analytics']> };

const initialState: WorkflowState = {
  campaigns: [],
  activeWorkflows: {},
  contentItems: [],
  activeTab: 'command-center',
  isRealTimeConnected: false,
  workflowQueue: [],
  notifications: [],
  analytics: {
    totalCampaigns: 0,
    completionRate: 0,
    averageTime: 0,
    activeAgents: 0
  }
};

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    
    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'SET_WORKFLOW_STAGES':
      return {
        ...state,
        activeWorkflows: {
          ...state.activeWorkflows,
          [action.payload.campaignId]: action.payload.stages
        }
      };
    
    case 'UPDATE_WORKFLOW_STAGE': {
      const campaignId = action.payload.campaign_id;
      const currentStages = state.activeWorkflows[campaignId] || [];
      const idx = currentStages.findIndex(stage => stage.stage_name === action.payload.stage_name);
      const nextStages = idx >= 0
        ? currentStages.map(stage =>
            stage.stage_name === action.payload.stage_name ? action.payload : stage
          )
        : [...currentStages, action.payload];
      return {
        ...state,
        activeWorkflows: {
          ...state.activeWorkflows,
          [campaignId]: nextStages
        }
      };
    }
    case 'SET_CONTENT_ITEMS':
      return { ...state, contentItems: action.payload };
    
    case 'ADD_CONTENT_ITEM':
      return {
        ...state,
        contentItems: [...state.contentItems, action.payload]
      };
    
    case 'UPDATE_CONTENT_ITEM':
      return {
        ...state,
        contentItems: state.contentItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case 'SET_CURRENT_CAMPAIGN':
      return { ...state, currentCampaignId: action.payload };
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'SET_REALTIME_STATUS':
      return { ...state, isRealTimeConnected: action.payload };
    
    case 'SET_PROCESSING_STAGE':
      return { ...state, processingStage: action.payload };
    
    case 'SET_LIVE_PREVIEW':
      return { ...state, livePreview: action.payload };
    
    case 'ADD_TO_QUEUE':
      return { ...state, workflowQueue: [...state.workflowQueue, action.payload] };
    
    case 'REMOVE_FROM_QUEUE':
      return { 
        ...state, 
        workflowQueue: state.workflowQueue.filter(c => c.id !== action.payload) 
      };
    
    case 'SET_ESTIMATED_TIME':
      return { ...state, estimatedTimeRemaining: action.payload };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications.slice(0, 19)] 
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'UPDATE_ANALYTICS':
      return {
        ...state,
        analytics: { ...state.analytics, ...action.payload }
      };
    
    default:
      return state;
  }
}

interface WorkflowContextType extends WorkflowState {
  dispatch: React.Dispatch<WorkflowAction>;
  loadCampaigns: () => Promise<void>;
  loadWorkflowStages: (campaignId: string) => Promise<void>;
  loadContentItems: () => Promise<void>;
  sendCommand: (command: string, config: any) => Promise<string | undefined>;
  autoNavigateBasedOnProgress: () => void;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  calculateEstimatedTime: (workflow: WorkflowStage[]) => number;
  prioritizeCampaign: (campaignId: string) => void;
  retryFailedStage: (campaignId: string, stageName: string) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const { toast } = useToast();

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch({ type: 'SET_CAMPAIGNS', payload: data || [] });
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadWorkflowStages = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('workflow_stages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      dispatch({ 
        type: 'SET_WORKFLOW_STAGES', 
        payload: { campaignId, stages: data || [] } 
      });
    } catch (error) {
      console.error('Error loading workflow stages:', error);
    }
  };

  const loadContentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch({ type: 'SET_CONTENT_ITEMS', payload: data || [] });
    } catch (error) {
      console.error('Error loading content items:', error);
    }
  };

  const sendCommand = async (command: string, config: any): Promise<string | undefined> => {
    try {
      dispatch({ type: 'SET_PROCESSING_STAGE', payload: 'initializing' });
      
      console.log('Sending command to Riven:', { command, config });
      
      // Enhanced email command detection
      const lowerCommand = command.toLowerCase();
      const emailKeywords = ['email', 'newsletter', 'mailing', 'send', 'notify', 'subscribers', 
                           'announcement', 'update', 'alert', 'invitation'];
      const blogKeywords = ['blog', 'article', 'post', 'write', 'content', 'seo', 'publish'];
      
      const isEmailCommand = emailKeywords.some(keyword => lowerCommand.includes(keyword)) ||
                            lowerCommand.includes('message to') || lowerCommand.includes('email to');
      const isBlogCommand = blogKeywords.some(keyword => lowerCommand.includes(keyword));
      
      // Prioritize explicit content type, then command analysis
      let contentType = config?.content_type;
      let platform = config?.platform;
      
      if (!contentType) {
        if (isEmailCommand && !isBlogCommand) {
          contentType = 'email_campaign';
          platform = 'email';
        } else {
          contentType = 'blog_post';
          platform = 'blog';
        }
      }
      
      console.log('Command analysis:', { 
        command: command.substring(0, 100), 
        isEmailCommand, 
        isBlogCommand, 
        finalContentType: contentType,
        finalPlatform: platform 
      });
      
      const { data, error } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { 
          command, 
          title: config?.title || `Campaign: ${command.substring(0, 50)}...`,
          platform: platform,
          content_type: contentType,
          image_generation: config?.image_generation || false,
          image_prompt: config?.image_prompt || '',
          template_id: config?.template_id,
          word_count: config?.word_count || 800,
          seo_optimization: config?.seo_optimization !== false,
          settings: {
            word_count: config?.word_count || 900,
            content_depth: config?.content_depth || 'high',
            seo_difficulty: config?.seo_difficulty || 'medium',
            image_generation: !!config?.image_generation,
            image_prompt: config?.image_prompt || ''
          },
          scheduling_options: {
            mode: config?.scheduling_mode || 'spread',
            spread_days: config?.spread_days || 7,
            posts_per_day: config?.posts_per_day || 1,
            total_posts: config?.total_posts || 3
          },
          publishing_controls: {
            platforms: config?.platforms || [platform],
            approval_required: config?.approval_required !== false
          }
        }
      });

      console.log('Riven response:', { data, error });

      if (error) {
        console.error('Riven function error:', error);
        throw error;
      }

      const campaignId = data?.campaignId || data?.campaign_id;
      if (campaignId) {
        dispatch({ type: 'SET_CURRENT_CAMPAIGN', payload: campaignId });
        
        // Load campaign and workflow data immediately
        await Promise.all([
          loadCampaigns(),
          loadWorkflowStages(campaignId)
        ]);
        
        toast({
          title: "Workflow Started",
          description: "Riven is now processing your command",
        });

        // Set up resilient polling (fetch fresh data, avoid stale closures)
        const pollInterval = setInterval(async () => {
          const { data: freshStages, error: wfErr } = await supabase
            .from('workflow_stages')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true });

          if (!wfErr && freshStages) {
            dispatch({ 
              type: 'SET_WORKFLOW_STAGES', 
              payload: { campaignId, stages: freshStages }
            });

            const isDone = freshStages.every(s => s.status === 'completed' || s.status === 'failed');
            if (isDone) {
              clearInterval(pollInterval);
              await loadContentItems();
              
              // Auto-create email campaigns for email content (with error handling)
              try {
                await autoCreateEmailCampaignsIfNeeded(campaignId);
              } catch (emailError) {
                console.error('❌ Email campaign creation failed:', emailError);
                // Don't break the workflow - just log the error
              }
              
              dispatch({ type: 'SET_PROCESSING_STAGE', payload: undefined });
            }
          }
        }, 2000);

        // Clear polling after 5 minutes as failsafe
        setTimeout(() => {
          clearInterval(pollInterval);
          dispatch({ type: 'SET_PROCESSING_STAGE', payload: undefined });
        }, 300000);
      }

      return campaignId;
    } catch (error) {
      console.error('Error sending command:', error);
      dispatch({ type: 'SET_PROCESSING_STAGE', payload: undefined });
      toast({
        title: "Command Failed",
        description: error?.message || "Failed to send command to Riven",
        variant: "destructive"
      });
      throw error;
    }
  };

  const autoNavigateBasedOnProgress = () => {
    if (!state.currentCampaignId) return;

    const workflow = state.activeWorkflows[state.currentCampaignId];
    if (!workflow) return;

    const completedStages = workflow.filter(stage => stage.status === 'completed');
    const inProgressStage = workflow.find(stage => stage.status === 'in_progress');
    
    if (inProgressStage) {
      dispatch({ type: 'SET_PROCESSING_STAGE', payload: inProgressStage.stage_name });
      
      // Enhanced auto-navigation with live preview
      if (inProgressStage.stage_name === 'content_creation' && state.activeTab === 'command-center') {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'creation-pipeline' });
        addNotification('info', 'Content Creation Started', 'AI is now generating your content');
      } else if (inProgressStage.stage_name === 'quality_assembly' && state.activeTab === 'creation-pipeline') {
        // Update live preview with partial content
        if (inProgressStage.output_data) {
          dispatch({ type: 'SET_LIVE_PREVIEW', payload: inProgressStage.output_data });
        }
      } else if (completedStages.length >= 4 && state.activeTab !== 'content-approval') {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'content-approval' });
        addNotification('success', 'Content Ready', 'Your content is ready for review and approval');
      }
    }

    // Calculate estimated time remaining
    const estimatedTime = calculateEstimatedTime(workflow);
    dispatch({ type: 'SET_ESTIMATED_TIME', payload: estimatedTime });
  };

  const addNotification = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const notification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    toast({
      title,
      description: message,
    });
  };

  const calculateEstimatedTime = (workflow: WorkflowStage[]): number => {
    const avgStageTime = 45; // seconds per stage
    const pendingStages = workflow.filter(stage => 
      stage.status === 'pending' || stage.status === 'in_progress'
    ).length;
    return pendingStages * avgStageTime;
  };

  const prioritizeCampaign = (campaignId: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      dispatch({ type: 'REMOVE_FROM_QUEUE', payload: campaignId });
      dispatch({ type: 'ADD_TO_QUEUE', payload: { ...campaign, priority: 'high' } });
      addNotification('info', 'Campaign Prioritized', 'This campaign will be processed next');
    }
  };

  const autoCreateEmailCampaignsIfNeeded = async (campaignId: string) => {
    try {
      console.log('🔍 Checking for email content in campaign:', campaignId);
      
      // Get email content from this campaign
      const { data: emailContent, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('campaign_id', campaignId)
        .or('platform.eq.email,content_type.eq.email_campaign,content_type.eq.newsletter');

      console.log('📧 Email content found:', { 
        error, 
        count: emailContent?.length || 0,
        items: emailContent?.map(c => ({ id: c.id, platform: c.platform, content_type: c.content_type }))
      });

      if (error) {
        console.error('❌ Error fetching email content:', error);
        return;
      }

      if (!emailContent?.length) {
        console.log('✅ No email content found, skipping email campaign creation');
        return;
      }

      // Create email campaigns for each email content
      for (const content of emailContent) {
        try {
          console.log('🚀 Creating email campaign for content:', content.id);
          
          // Use database function for safer campaign creation
          const { data: campaignId, error: campaignError } = await supabase
            .rpc('create_email_campaign_from_content', {
              p_content_id: content.id,
              p_campaign_name: content.title
            });

          console.log('📧 Email campaign creation result:', { campaignId, campaignError });

          if (campaignError) {
            console.error('❌ Email campaign creation error:', campaignError);
            addNotification('warning', 'Email Campaign Error', `Failed to create email campaign: ${campaignError.message}`);
            continue; // Continue with other email content
          }

          if (campaignId) {
            console.log('✅ Email campaign created successfully with ID:', campaignId);
            addNotification('success', 'Email Campaign Created', `Email campaign ready for: ${content.title}`);
          }
        } catch (emailError) {
          console.error('❌ Unexpected error creating email campaign:', emailError);
          addNotification('warning', 'Email Campaign Error', `Unexpected error: ${emailError?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in autoCreateEmailCampaignsIfNeeded:', error);
      // Don't throw the error - just log it so the workflow can continue
      addNotification('warning', 'Email Processing Warning', 'Some email processing encountered issues but workflow completed');
    }
  };

  const retryFailedStage = async (campaignId: string, stageName: string) => {
    try {
      const { error } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { 
          command: 'retry_stage', 
          campaignId, 
          stageName 
        }
      });

      if (error) throw error;
      
      addNotification('info', 'Stage Retry', `Retrying ${stageName.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error retrying stage:', error);
      addNotification('error', 'Retry Failed', 'Failed to retry the failed stage');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const campaignsChannel = supabase
      .channel('campaigns-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_campaigns'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'UPDATE_CAMPAIGN', payload: payload.new as Campaign });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_CAMPAIGN', payload: payload.new as Campaign });
        }
      })
      .subscribe();

    const workflowChannel = supabase
      .channel('workflow-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_stages'
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_WORKFLOW_STAGE', payload: payload.new as WorkflowStage });
        }
      })
      .subscribe();

    const contentChannel = supabase
      .channel('content-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_content'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_CONTENT_ITEM', payload: payload.new as MarketingContent });
          
          // Auto-navigate to approval when content is ready
          if (payload.new.status === 'draft') {
            dispatch({ type: 'SET_ACTIVE_TAB', payload: 'content-approval' });
          }
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_CONTENT_ITEM', payload: payload.new as MarketingContent });
        }
      })
      .subscribe();

    dispatch({ type: 'SET_REALTIME_STATUS', payload: true });

    return () => {
      supabase.removeChannel(campaignsChannel);
      supabase.removeChannel(workflowChannel);
      supabase.removeChannel(contentChannel);
    };
  }, []);

  // Auto-navigate based on progress
  useEffect(() => {
    autoNavigateBasedOnProgress();
  }, [state.activeWorkflows, state.currentCampaignId]);

  // Load initial data
  useEffect(() => {
    loadCampaigns();
    loadContentItems();
  }, []);

  const contextValue: WorkflowContextType = {
    ...state,
    dispatch,
    loadCampaigns,
    loadWorkflowStages,
    loadContentItems,
    sendCommand,
    autoNavigateBasedOnProgress,
    addNotification,
    calculateEstimatedTime,
    prioritizeCampaign,
    retryFailedStage,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};