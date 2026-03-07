import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CheckCircle,
  AlertCircle,
  Loader2,
  Unlink
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  platform_name: string;
  connection_status: string;
  updated_at: string;
}

interface SocialMediaOAuthProps {
  accounts: any[];
  onAccountsUpdate: () => void;
}

const platformConfigs = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    description: 'Share posts, create events, and engage with your audience'
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    description: 'Post photos, stories, and reels to reach younger demographics'
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    description: 'Share quick updates and engage in real-time conversations'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    description: 'Build professional relationships and share business content'
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    description: 'Upload videos and build a subscriber base'
  }
};

const SocialMediaOAuth: React.FC<SocialMediaOAuthProps> = ({ accounts, onAccountsUpdate }) => {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);

  const initiateOAuth = async (platform: string) => {
    setConnecting(platform);

    try {
      const { data, error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          action: 'initiate',
          platform,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open OAuth popup
        const popup = window.open(
          data.authUrl,
          'oauth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth callback
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'oauth-callback') {
            popup?.close();
            window.removeEventListener('message', messageListener);

            if (event.data.success) {
              handleOAuthCallback(platform, event.data.code, event.data.state);
            } else {
              setConnecting(null);
              toast({
                title: "Authentication Failed",
                description: event.data.error || "Failed to authenticate with " + platform,
                variant: "destructive"
              });
            }
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup was blocked
        if (!popup) {
          setConnecting(null);
          toast({
            title: "Popup Blocked",
            description: "Please allow popups and try again",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      setConnecting(null);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate OAuth flow",
        variant: "destructive"
      });
    }
  };

  const handleOAuthCallback = async (platform: string, code: string, state: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          action: 'callback',
          platform,
          code,
          state,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Successfully Connected!",
        description: `Your ${platform} account has been connected`,
      });

      onAccountsUpdate();
    } catch (error: any) {
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
          action: 'disconnect',
          platform,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Account Disconnected",
        description: `Your ${platform} account has been disconnected`,
      });

      onAccountsUpdate();
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect account",
        variant: "destructive"
      });
    }
  };

  const getAccountForPlatform = (platform: string) => {
    return accounts.find(account => account.platform === platform);
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(platformConfigs).map(([platformId, config]) => {
        const account = getAccountForPlatform(platformId);
        const Icon = config.icon;
        const isConnecting = connecting === platformId;
        const isConnected = account?.connection_status === 'connected';

        return (
          <Card key={platformId} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}15` }}>
                  <Icon className="h-6 w-6" style={{ color: config.color }} />
                </div>
                <div>
                  <div className="font-semibold">{config.name}</div>
                  {isConnected && (
                    <Badge variant="default" className="bg-green-500 text-white mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {config.description}
              </p>

              {isConnected ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium">{account?.platform_name || 'Connected Account'}</div>
                    <div className="text-muted-foreground text-xs">
                      Connected {new Date(account?.updated_at || '').toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount(platformId)}
                    className="w-full"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => initiateOAuth(platformId)}
                  disabled={isConnecting}
                  className="w-full"
                  style={{ backgroundColor: config.color }}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      Connect {config.name}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SocialMediaOAuth;