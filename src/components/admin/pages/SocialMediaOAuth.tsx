import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Users,
  Zap
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_status: string;
  follower_count: number;
  last_connected: string;
  posting_permissions: any;
  rate_limits: any;
}

interface SocialMediaOAuthProps {
  accounts: SocialAccount[];
  onAccountsUpdate: () => void;
}

const platformConfigs = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Connect your Facebook Page to post updates and manage content',
    permissions: ['pages_manage_posts', 'pages_read_engagement']
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-sky-500',
    description: 'Connect your Twitter account to share tweets and engage with followers',
    permissions: ['tweet.read', 'tweet.write', 'users.read']
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Connect your LinkedIn profile or company page for professional content',
    permissions: ['w_member_social', 'r_liteprofile']
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Connect your Instagram Business account to share photos and stories',
    permissions: ['instagram_basic', 'instagram_content_publish']
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    description: 'Connect your YouTube channel to upload and manage video content',
    permissions: ['youtube.upload', 'youtube.readonly']
  }
};

export function SocialMediaOAuth({ accounts, onAccountsUpdate }: SocialMediaOAuthProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const getAccountForPlatform = (platform: string) => {
    return accounts.find(acc => acc.platform === platform);
  };

  const initiateOAuth = async (platform: string) => {
    setConnecting(platform);
    
    try {
      const { data, error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          platform,
          action: 'initiate',
          redirectUri: `${window.location.origin}/admin-dashboard/ai-marketing?oauth_callback=true`
        }
      });

      if (error) throw error;

      // Open OAuth window
      const popup = window.open(
        data.authUrl,
        'oauth_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          handleOAuthCallback(platform, event.data.code, data.state);
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          toast({
            title: "Connection Failed",
            description: event.data.error || "Failed to connect account",
            variant: "destructive"
          });
          setConnecting(null);
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback: poll for popup close
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
        }
      }, 1000);

    } catch (error: any) {
      console.error('OAuth initiation error:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to start OAuth flow",
        variant: "destructive"
      });
      setConnecting(null);
    }
  };

  const handleOAuthCallback = async (platform: string, code: string, state: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          platform,
          action: 'callback',
          code,
          state
        }
      });

      if (error) throw error;

      toast({
        title: "Account Connected",
        description: `Successfully connected your ${platformConfigs[platform as keyof typeof platformConfigs].name} account`,
      });

      onAccountsUpdate();
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to complete OAuth flow",
        variant: "destructive"
      });
    } finally {
      setConnecting(null);
    }
  };

  const disconnectAccount = async (platform: string) => {
    try {
      const { error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          platform,
          action: 'disconnect'
        }
      });

      if (error) throw error;

      toast({
        title: "Account Disconnected",
        description: `Successfully disconnected your ${platformConfigs[platform as keyof typeof platformConfigs].name} account`,
      });

      onAccountsUpdate();
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect account",
        variant: "destructive"
      });
    }
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(platformConfigs).map(([platform, config]) => {
        const account = getAccountForPlatform(platform);
        const Icon = config.icon;
        const isConnected = account?.account_status === 'connected';
        const isConnecting = connecting === platform;

        return (
          <Card key={platform} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${config.color}`} />
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${config.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    {isConnected && (
                      <div className="flex items-center space-x-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Connected</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {isConnected && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {formatFollowerCount(account.follower_count)}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{config.description}</p>

              {isConnected && account && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium">{account.account_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last sync:</span>
                    <span>{new Date(account.last_connected).toLocaleDateString()}</span>
                  </div>

                  {account.rate_limits && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rate limit:</span>
                      <span>{account.rate_limits.posts_per_hour || 10}/hour</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {config.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                {isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectAccount(platform)}
                      className="flex-1"
                    >
                      Disconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => initiateOAuth(platform)}
                      disabled={isConnecting}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => initiateOAuth(platform)}
                    disabled={isConnecting}
                    className="w-full"
                    size="sm"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect {config.name}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}