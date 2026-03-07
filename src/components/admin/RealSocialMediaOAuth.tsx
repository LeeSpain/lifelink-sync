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
  CheckCircle,
  AlertCircle,
  Loader2,
  Unlink
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  platform_name: string;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
  created_at: string;
}

interface RealSocialMediaOAuthProps {
  onAccountsUpdate?: () => void;
}

const platformConfigs = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    description: 'Connect your Facebook page'
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    description: 'Connect your Instagram business account'
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: '#1DA1F2',
    description: 'Connect your Twitter account'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    description: 'Connect your LinkedIn company page'
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    description: 'Connect your YouTube channel'
  }
};

export const RealSocialMediaOAuth: React.FC<RealSocialMediaOAuthProps> = ({
  onAccountsUpdate
}) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_oauth')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts((data || []).map(account => ({
        id: account.id,
        platform: account.platform,
        platform_name: account.platform_name || '',
        connection_status: account.connection_status as 'connected' | 'disconnected' | 'error',
        last_sync: account.last_used_at || account.created_at,
        created_at: account.created_at
      })));
    } catch (error) {
      console.error('Error loading social accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load social media accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform: string) => {
    setConnecting(platform);
    try {
      const { data, error } = await supabase.functions.invoke('social-oauth-handler', {
        body: {
          action: 'initiate_oauth',
          platform
        }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open OAuth popup
        const popup = window.open(
          data.authUrl,
          'oauth-popup',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setConnecting(null);
            loadAccounts(); // Refresh accounts
            onAccountsUpdate?.();
          }
        }, 1000);

        toast({
          title: "OAuth Started",
          description: `Please complete authentication for ${platformConfigs[platform]?.name}`,
        });
      }
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${platformConfigs[platform]?.name}: ${error.message}`,
        variant: "destructive"
      });
      setConnecting(null);
    }
  };

  const disconnectAccount = async (accountId: string, platform: string) => {
    try {
      const { error } = await supabase.functions.invoke('social-oauth-handler', {
        body: {
          action: 'disconnect',
          accountId
        }
      });

      if (error) throw error;

      toast({
        title: "Account Disconnected",
        description: `${platformConfigs[platform]?.name} account has been disconnected`,
      });

      loadAccounts();
      onAccountsUpdate?.();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive"
      });
    }
  };

  const getAccountForPlatform = (platform: string) => {
    return accounts.find(account => account.platform === platform);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading social media accounts...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Social Media Connections</h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to enable automated posting and real analytics.
        </p>
      </div>

      <div className="grid gap-4">
        {Object.entries(platformConfigs).map(([platform, config]) => {
          const account = getAccountForPlatform(platform);
          const Icon = config.icon;
          const isConnected = account?.connection_status === 'connected';
          const isConnecting = connecting === platform;

          return (
            <Card key={platform} className="relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      <Icon 
                        className="h-6 w-6"
                        style={{ color: config.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{config.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                      {account && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={isConnected ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {isConnected ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                            ) : (
                              <><AlertCircle className="h-3 w-3 mr-1" /> Error</>
                            )}
                          </Badge>
                          {account.platform_name && (
                            <span className="text-xs text-muted-foreground">
                              as {account.platform_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectAccount(account.id, platform)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => connectAccount(platform)}
                        disabled={isConnecting}
                        style={{ backgroundColor: config.color }}
                        className="text-white hover:opacity-90"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            Connect {config.name}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {accounts.filter(a => a.connection_status === 'connected').length}
                </div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {accounts.filter(a => a.connection_status === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {accounts.length}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(platformConfigs).length - accounts.length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};