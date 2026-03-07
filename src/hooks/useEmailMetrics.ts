import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailMetrics {
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  pendingEmails: number;
  failedEmails: number;
  sentEmails: number;
}

export const useEmailMetrics = () => {
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalCampaigns: 0,
    totalEmailsSent: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
    pendingEmails: 0,
    failedEmails: 0,
    sentEmails: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmailMetrics();
  }, []);

  const loadEmailMetrics = async () => {
    try {
      setLoading(true);

      // Get total email campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from('marketing_content')
        .select('id')
        .eq('content_type', 'email_campaign');

      if (campaignError) throw campaignError;

      // Get email queue statistics
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('status, sent_at, created_at');

      if (queueError) throw queueError;

      // Get email logs for open/click rates (if available)
      const { data: emailLogs, error: logsError } = await supabase
        .from('email_logs')
        .select('opened_at, clicked_at, created_at, status')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Calculate metrics
      const totalCampaigns = campaigns?.length || 0;
      const totalEmailsSent = queueData?.length || 0;
      const sentEmails = queueData?.filter(email => email.status === 'sent').length || 0;
      const pendingEmails = queueData?.filter(email => email.status === 'pending').length || 0;
      const failedEmails = queueData?.filter(email => email.status === 'failed').length || 0;

      // Calculate open and click rates from logs (if available)
      let averageOpenRate = 0;
      let averageClickRate = 0;

      if (!logsError && emailLogs && emailLogs.length > 0) {
        const opens = emailLogs.filter(log => log.opened_at !== null).length;
        const clicks = emailLogs.filter(log => log.clicked_at !== null).length;
        
        if (sentEmails > 0) {
          averageOpenRate = Math.round((opens / sentEmails) * 100);
          averageClickRate = Math.round((clicks / sentEmails) * 100);
        }
      }

      setMetrics({
        totalCampaigns,
        totalEmailsSent,
        averageOpenRate,
        averageClickRate,
        pendingEmails,
        failedEmails,
        sentEmails
      });

    } catch (error) {
      console.error('Error loading email metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, refreshMetrics: loadEmailMetrics };
};