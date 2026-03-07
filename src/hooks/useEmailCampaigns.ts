import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  text_content?: string;
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed';
  content_id?: string;
  recipient_count?: number;
  sent_count?: number;
  created_at: string;
  metadata?: any;
}

export interface EmailMetrics {
  totalCampaigns: number;
  emailsSent: number;
  emailsPending: number;
  emailsFailed: number;
  openRate: number;
  clickRate: number;
}

export function useEmailCampaigns() {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const { toast } = useToast();

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns((data || []) as EmailCampaign[]);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error Loading Campaigns",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCampaign = useCallback(async (contentId: string, campaignData?: any) => {
    try {
      setLoading(true);

      console.log('🚀 Creating email campaign for content:', contentId);

      const { data, error } = await supabase.functions.invoke('email-campaign-creator', {
        body: {
          action: 'create_campaign',
          content_id: contentId,
          campaign_data: {
            ...campaignData,
            sender_email: 'marketing@lifelinksync.com',
            sender_name: 'LifeLink Sync Team'
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Campaign Created",
          description: "Email campaign has been created successfully",
        });
        
        await loadCampaigns();
        return data.campaign;
      } else {
        throw new Error(data?.error || 'Failed to create campaign');
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error Creating Campaign",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, loadCampaigns]);

  const queueCampaign = useCallback(async (campaignId: string, targetCriteria?: any) => {
    try {
      setLoading(true);

      // Get campaign details first
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      if (!campaign.content_id) throw new Error('Campaign missing content reference');

      const { data, error } = await supabase.functions.invoke('email-campaign-creator', {
        body: {
          action: 'queue_emails',
          content_id: campaign.content_id,
          target_criteria: {
            include_subscribers: true,
            include_users: false,
            ...targetCriteria
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Emails Queued",
          description: `${data.emails_queued} emails have been queued for sending`,
        });
        
        await loadCampaigns();
        return data;
      } else {
        throw new Error(data?.error || 'Failed to queue emails');
      }
    } catch (error: any) {
      console.error('Error queueing campaign:', error);
      toast({
        title: "Error Queueing Campaign",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, loadCampaigns]);

  const sendCampaign = useCallback(async (campaignId: string) => {
    try {
      setLoading(true);

      // First queue the campaign
      await queueCampaign(campaignId);

      // Then trigger the email processor
      const { data, error } = await supabase.functions.invoke('email-processor', {
        body: {
          action: 'process_queue',
          max_emails: 50
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Campaign Sent",
          description: `${data.sent} emails sent successfully`,
        });
        
        await loadCampaigns();
        return data;
      } else {
        throw new Error(data?.error || 'Failed to send campaign');
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: "Error Sending Campaign",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, loadCampaigns, queueCampaign]);

  const getRecipients = useCallback(async (criteria?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-campaign-creator', {
        body: {
          action: 'get_recipients',
          target_criteria: {
            include_subscribers: true,
            include_users: false,
            ...criteria
          }
        }
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting recipients:', error);
      toast({
        title: "Error Getting Recipients",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const loadMetrics = useCallback(async () => {
    try {
      // Get campaign metrics
      const { data: campaignData, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*');

      if (campaignError) throw campaignError;

      // Get queue metrics
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('status');

      if (queueError) throw queueError;

      // Calculate metrics
      const totalCampaigns = campaignData?.length || 0;
      const emailsSent = queueData?.filter(e => e.status === 'sent').length || 0;
      const emailsPending = queueData?.filter(e => e.status === 'pending').length || 0;
      const emailsFailed = queueData?.filter(e => e.status === 'failed').length || 0;

      // Mock open/click rates for now
      const openRate = emailsSent > 0 ? 25.5 : 0;
      const clickRate = emailsSent > 0 ? 3.2 : 0;

      setMetrics({
        totalCampaigns,
        emailsSent,
        emailsPending,
        emailsFailed,
        openRate,
        clickRate
      });
    } catch (error: any) {
      console.error('Error loading metrics:', error);
    }
  }, []);

  const processEmailQueue = useCallback(async (maxEmails = 10) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-processor', {
        body: {
          action: 'process_queue',
          max_emails: maxEmails
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Queue Processed",
          description: `Processed ${data.processed} emails (${data.sent} sent, ${data.failed} failed)`,
        });
        
        await loadMetrics();
        return data;
      }
    } catch (error: any) {
      console.error('Error processing queue:', error);
      toast({
        title: "Error Processing Queue",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast, loadMetrics]);

  return {
    campaigns,
    metrics,
    loading,
    loadCampaigns,
    createCampaign,
    queueCampaign,
    sendCampaign,
    getRecipients,
    loadMetrics,
    processEmailQueue
  };
}