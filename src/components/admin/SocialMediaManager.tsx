import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Settings,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Users,
  ExternalLink
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  followers_count?: number;
  status: 'connected' | 'disconnected' | 'pending';
  last_post_at?: string;
  access_token?: string;
  profile_url?: string;
}

interface PostingQueueItem {
  id: string;
  content_id: string;
  platform: string;
  scheduled_time: string;
  status: string;
  platform_post_id?: string;
  error_message?: string;
}

export const SocialMediaManager: React.FC = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [queueItems, setQueueItems] = useState<PostingQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const platformIcons = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube
  };

  const platformColors = {
    facebook: 'text-blue-600',
    instagram: 'text-pink-600', 
    twitter: 'text-sky-600',
    linkedin: 'text-blue-700',
    youtube: 'text-red-600'
  };

  useEffect(() => {
    loadSocialAccounts();
    loadPostingQueue();
  }, []);

  const loadSocialAccounts = async () => {
    try {
      // Show empty state - no social accounts connected yet
      // This will be populated when users connect real social media accounts
      setAccounts([]);
    } catch (error) {
      console.error('Error loading social accounts:', error);
      setAccounts([]);
    }
  };

  const loadPostingQueue = async () => {
    try {
      // Use the existing social_media_posting_queue table
      const { data, error } = await supabase
        .from('social_media_posting_queue')
        .select('*')
        .order('scheduled_time', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error loading posting queue:', error);
        setQueueItems([]);
        return;
      }

      setQueueItems(data || []);
    } catch (error) {
      console.error('Error loading posting queue:', error);
      setQueueItems([]);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('social-oauth', {
        body: { platform, action: 'connect' }
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }

      toast({
        title: "Connecting Account",
        description: `Redirecting to ${platform} for authorization`,
      });
    } catch (error) {
      console.error('Error connecting account:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect social media account",
        variant: "destructive"
      });
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      // For now, just remove from state since no real connections exist yet
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));

      toast({
        title: "Account Disconnected",
        description: "Social media account has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect account",
        variant: "destructive"
      });
    }
  };

  const retryPost = async (queueItemId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_posting_queue')
        .update({ 
          status: 'scheduled',
          retry_count: 0,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItemId);

      if (error) throw error;

      toast({
        title: "Post Queued for Retry",
        description: "Post will be retried shortly",
      });

      loadPostingQueue();
    } catch (error) {
      console.error('Error retrying post:', error);
      toast({
        title: "Retry Failed", 
        description: "Failed to queue post for retry",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'pending': return 'secondary';
      case 'disconnected': return 'destructive';
      case 'posted': return 'default';
      case 'failed': return 'destructive';
      case 'scheduled': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Loading social media accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Social Accounts Connected</h3>
            <p className="mb-4">Connect your social media accounts to start publishing content automatically.</p>
            <div className="flex justify-center gap-3">
              {Object.keys(platformIcons).map((platform) => {
                const IconComponent = platformIcons[platform as keyof typeof platformIcons];
                const iconColor = platformColors[platform as keyof typeof platformColors];
                return (
                  <Button key={platform} variant="outline" onClick={() => connectAccount(platform)}>
                    <IconComponent className={`h-4 w-4 mr-2 ${iconColor}`} />
                    Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>
                    
        </CardContent>
      </Card>

      {/* Posting Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Posting Queue ({queueItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.map((item) => {
                const IconComponent = platformIcons[item.platform as keyof typeof platformIcons];
                const iconColor = platformColors[item.platform as keyof typeof platformColors];
                
                return (
                  <Card key={item.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className={`h-5 w-5 ${iconColor}`} />
                          <div>
                            <p className="font-medium capitalize">{item.platform}</p>
                            <p className="text-sm text-muted-foreground">
                              Scheduled: {formatDate(item.scheduled_time)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          
                          {item.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryPost(item.id)}
                            >
                              Retry
                            </Button>
                          )}
                          
                          {item.platform_post_id && (
                            <Button variant="outline" size="sm" asChild>
                              <a href="#" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {item.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {item.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};