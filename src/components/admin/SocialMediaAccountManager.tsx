import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  email: string;
  isConnected: boolean;
  lastSync: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  connectionStatus: 'connected' | 'expired' | 'error';
  profileData?: any;
}

interface SocialMediaAccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialMediaAccountManager: React.FC<SocialMediaAccountManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_media_oauth')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const socialAccounts: SocialAccount[] = data?.map(account => ({
        id: account.id,
        platform: account.platform,
        username: account.platform_name || '',
        email: account.platform_name || '',
        isConnected: account.connection_status === 'connected',
        lastSync: account.updated_at,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.token_expires_at,
        connectionStatus: account.connection_status as SocialAccount['connectionStatus'],
        profileData: {
          followers_count: account.follower_count,
          following_count: 0 // Not available in current schema
        }
      })) || [];

      setAccounts(socialAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load social media accounts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectAccount = async (platform: string) => {
    setConnectingPlatform(platform);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          action: 'initiate',
          platform,
          userId: user.user.id
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

        // Poll for popup closure
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setConnectingPlatform(null);
            // Refresh accounts after potential connection
            setTimeout(loadAccounts, 2000);
          }
        }, 1000);

        toast({
          title: "OAuth Started",
          description: `Please complete authentication for ${platform} in the popup window`,
        });
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${platform}: ${error.message}`,
        variant: "destructive"
      });
      setConnectingPlatform(null);
    }
  };

  const disconnectAccount = async (accountId: string, platform: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          action: 'disconnect',
          platform,
          userId: user.user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Account Disconnected",
        description: `${platform} account has been disconnected`,
      });

      loadAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect ${platform}`,
        variant: "destructive"
      });
    }
  };

  const refreshToken = async (accountId: string, platform: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('social-media-oauth', {
        body: {
          action: 'refresh',
          platform,
          userId: user.user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Token Refreshed",
        description: `${platform} access token has been refreshed`,
      });

      loadAccounts();
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast({
        title: "Refresh Failed",
        description: `Failed to refresh ${platform} token`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (account: SocialAccount) => {
    switch (account.connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Disconnected
          </Badge>
        );
    }
  };

  const getConnectedAccount = (platform: string) => {
    return accounts.find(acc => acc.platform === platform && acc.isConnected);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media Account Manager
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAccounts}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const connectedAccount = getConnectedAccount(platform.id);
              const isConnecting = connectingPlatform === platform.id;

              return (
                <Card key={platform.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon 
                        className="h-8 w-8" 
                        style={{ color: platform.color }}
                      />
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        {connectedAccount && (
                          <p className="text-sm text-muted-foreground">
                            {connectedAccount.username || connectedAccount.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {connectedAccount && getStatusBadge(connectedAccount)}
                  </div>

                  {connectedAccount ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Last sync: {new Date(connectedAccount.lastSync).toLocaleString()}
                      </div>
                      
                      <div className="flex gap-2">
                        {connectedAccount.connectionStatus === 'expired' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refreshToken(connectedAccount.id, platform.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectAccount(connectedAccount.id, platform.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Disconnect
                        </Button>
                      </div>

                      {connectedAccount.profileData && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Profile Info:</strong>
                          <div>Followers: {connectedAccount.profileData.followers_count?.toLocaleString() || 'N/A'}</div>
                          <div>Following: {connectedAccount.profileData.following_count?.toLocaleString() || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => connectAccount(platform.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Connect {platform.name}
                        </>
                      )}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Connected Accounts Overview */}
          {accounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => {
                    const platform = platforms.find(p => p.id === account.platform);
                    if (!platform) return null;
                    
                    const Icon = platform.icon;
                    
                    return (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Icon 
                            className="h-6 w-6" 
                            style={{ color: platform.color }}
                          />
                          <div>
                            <h4 className="font-medium">{platform.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {account.username || account.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Connected: {new Date(account.lastSync).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account)}
                          
                          {account.expiresAt && (
                            <div className="text-xs text-muted-foreground">
                              Expires: {new Date(account.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* OAuth Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">OAuth Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="space-y-2 text-sm">
                <p>• <strong>Facebook/Instagram:</strong> Requires approved Facebook app with proper permissions</p>
                <p>• <strong>Twitter:</strong> Requires Twitter API v2 credentials with write permissions</p>
                <p>• <strong>LinkedIn:</strong> Requires LinkedIn app with marketing permissions</p>
                <p>• <strong>YouTube:</strong> Requires Google Cloud project with YouTube Data API</p>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Setup Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};