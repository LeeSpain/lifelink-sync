import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle, Clock, RefreshCw, Send, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialQueueItem {
  id: string;
  content_id: string;
  platform: string;
  status: string;
  scheduled_time: string | null;
  posted_at: string | null;
  platform_post_id: string | null;
  error_message: string | null;
  retry_count: number;
}

interface SocialPostingStatusProps {
  contentId: string;
}

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  x: '𝕏',
  linkedin: 'in',
  facebook: 'f',
  instagram: '📷',
};

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
  queued: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Queued' },
  retry_scheduled: { variant: 'outline', icon: <RefreshCw className="h-3 w-3" />, label: 'Retry' },
  posted: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Posted' },
  failed: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" />, label: 'Failed' },
};

export const SocialPostingStatus: React.FC<SocialPostingStatusProps> = ({ contentId }) => {
  const [queueItems, setQueueItems] = useState<SocialQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();

  const loadQueueStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_posting_queue')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading social queue:', error);
        return;
      }

      setQueueItems(data || []);
    } catch (err) {
      console.error('Failed to load social queue status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueStatus();
  }, [contentId]);

  const handlePostNow = async () => {
    setPosting(true);
    try {
      // 1. Fetch connected platforms
      const { data: connectedPlatforms, error: platformError } = await supabase
        .from('social_media_oauth')
        .select('platform')
        .in('connection_status', ['connected', 'active']);

      if (platformError) throw platformError;

      if (!connectedPlatforms || connectedPlatforms.length === 0) {
        toast({
          title: "No Connected Platforms",
          description: "Connect social media accounts first.",
          variant: "destructive",
        });
        return;
      }

      // 2. Get existing queue items for this content
      const existingPlatforms = new Set(
        queueItems
          .filter(q => q.status === 'queued' || q.status === 'posted' || q.status === 'retry_scheduled')
          .map(q => q.platform.toLowerCase())
      );

      // 3. Insert missing queue rows
      const nowISO = new Date().toISOString();
      const newInserts = connectedPlatforms
        .filter(p => !existingPlatforms.has(p.platform.toLowerCase()))
        .map(p => ({
          content_id: contentId,
          platform: p.platform,
          status: 'queued',
          scheduled_time: nowISO,
          retry_count: 0,
        }));

      if (newInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('social_media_posting_queue')
          .insert(newInserts);

        if (insertError) throw insertError;
      }

      // 4. Update any existing queued items to schedule now
      const { error: updateError } = await supabase
        .from('social_media_posting_queue')
        .update({ scheduled_time: nowISO })
        .eq('content_id', contentId)
        .eq('status', 'queued');

      if (updateError) throw updateError;

      // 5. Invoke posting-processor
      const { data: result, error: invokeError } = await supabase.functions.invoke('posting-processor', { body: {} });

      if (invokeError) throw invokeError;

      toast({
        title: "Social Posting Complete",
        description: `Processed: ${result?.processed ?? 0}, Succeeded: ${result?.succeeded ?? 0}, Failed: ${result?.failed ?? 0}`,
      });

      // Refresh queue status
      await loadQueueStatus();
    } catch (err) {
      console.error('[PostNow]', err);
      toast({
        title: "Post Now Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const failedItems = queueItems.filter(q => q.status === 'failed');

      if (failedItems.length === 0) {
        toast({
          title: "No Failed Posts",
          description: "There are no failed posts to retry.",
        });
        return;
      }

      // Reset failed items to queued
      const { error: updateError } = await supabase
        .from('social_media_posting_queue')
        .update({ status: 'queued', retry_count: 0, error_message: null, scheduled_time: new Date().toISOString() })
        .eq('content_id', contentId)
        .eq('status', 'failed');

      if (updateError) throw updateError;

      // Invoke posting-processor
      const { data: result, error: invokeError } = await supabase.functions.invoke('posting-processor', { body: {} });

      if (invokeError) throw invokeError;

      toast({
        title: "Retry Complete",
        description: `Retried ${failedItems.length} posts. Succeeded: ${result?.succeeded ?? 0}, Failed: ${result?.failed ?? 0}`,
      });

      // Refresh queue status
      await loadQueueStatus();
    } catch (err) {
      console.error('[RetryFailed]', err);
      toast({
        title: "Retry Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const hasFailedItems = queueItems.some(q => q.status === 'failed');

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading social status...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className="text-xs text-muted-foreground mr-1">Social:</span>
        
        {queueItems.length > 0 ? (
          queueItems.map((item) => {
            const config = statusConfig[item.status] || statusConfig.queued;
            const platformIcon = platformIcons[item.platform.toLowerCase()] || item.platform.charAt(0).toUpperCase();

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={config.variant} 
                    className="text-xs px-1.5 py-0.5 gap-1 cursor-default"
                  >
                    <span className="font-bold">{platformIcon}</span>
                    {config.icon}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-semibold capitalize">{item.platform} - {config.label}</div>
                    {item.status === 'posted' && item.posted_at && (
                      <div className="text-xs">
                        Posted: {new Date(item.posted_at).toLocaleString()}
                      </div>
                    )}
                    {item.status === 'posted' && item.platform_post_id && (
                      <div className="text-xs text-muted-foreground">
                        ID: {item.platform_post_id.substring(0, 20)}...
                      </div>
                    )}
                    {item.status === 'retry_scheduled' && (
                      <div className="text-xs">
                        Retry #{item.retry_count} scheduled
                      </div>
                    )}
                    {item.status === 'failed' && item.error_message && (
                      <div className="text-xs text-destructive-foreground bg-destructive/10 p-1.5 rounded mt-1">
                        {item.error_message}
                      </div>
                    )}
                    {item.scheduled_time && item.status === 'queued' && (
                      <div className="text-xs">
                        Scheduled: {new Date(item.scheduled_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground">Not queued</span>
        )}

        {/* Action buttons */}
        <div className="flex gap-1 ml-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={handlePostNow}
            disabled={posting}
          >
            {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            Post Now
          </Button>
          
          {hasFailedItems && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={handleRetryFailed}
              disabled={retrying}
            >
              {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
              Retry Failed
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
