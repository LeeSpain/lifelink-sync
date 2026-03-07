import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Send,
  Eye,
  BarChart3,
  Users,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Settings,
  Zap,
  Target,
  Globe,
  Wifi,
  WifiOff,
  Activity,
  PlayCircle,
  PauseCircle,
  RefreshCw
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  platform_name: string;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
  created_at: string;
  metrics?: {
    followers: number;
    posts_this_month: number;
    engagement_rate: number;
    reach: number;
  };
}

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduled_time: string;
  status: 'scheduled' | 'posting' | 'posted' | 'failed';
  media_url?: string;
}

const platformConfigs = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    description: 'Connect your Facebook page for automated posting',
    features: ['Auto-posting', 'Analytics', 'Scheduling', 'Stories']
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    description: 'Connect your Instagram business account',
    features: ['Photo posts', 'Stories', 'Reels', 'Analytics']
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: '#1DA1F2',
    description: 'Connect your Twitter account for real-time updates',
    features: ['Tweets', 'Threads', 'Analytics', 'Trending topics']
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    description: 'Connect your LinkedIn company page',
    features: ['Professional posts', 'Articles', 'Company updates', 'Analytics']
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    description: 'Connect your YouTube channel',
    features: ['Video uploads', 'Community posts', 'Analytics', 'Shorts']
  }
};

const ProfessionalSocialHub: React.FC<{ onAccountsUpdate?: () => void }> = ({
  onAccountsUpdate
}) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [autoOptimize, setAutoOptimize] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadScheduledPosts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_oauth')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enhanced accounts with mock metrics
      const enhancedAccounts = (data || []).map(account => ({
        id: account.id,
        platform: account.platform,
        platform_name: account.platform_name || '',
        connection_status: account.connection_status as 'connected' | 'disconnected' | 'error',
        last_sync: account.last_used_at || account.created_at,
        created_at: account.created_at,
        metrics: {
          followers: Math.floor(Math.random() * 10000) + 1000,
          posts_this_month: Math.floor(Math.random() * 20) + 5,
          engagement_rate: Math.random() * 10 + 2,
          reach: Math.floor(Math.random() * 50000) + 5000
        }
      }));
      
      setAccounts(enhancedAccounts);
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

  const loadScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_posting_queue')
        .select('*')
        .order('scheduled_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      setScheduledPosts((data || []).map(post => ({
        id: post.id,
        platform: post.platform,
        content: post.platform_post_id || 'Content preview...',
        scheduled_time: post.scheduled_time,
        status: post.status as 'scheduled' | 'posting' | 'posted' | 'failed',
        media_url: undefined
      })));
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
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
        const popup = window.open(
          data.authUrl,
          'oauth-popup',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setConnecting(null);
            loadAccounts();
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
        description: `Failed to connect ${platformConfigs[platform]?.name}`,
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

  const schedulePost = async () => {
    if (!postContent.trim() || selectedPlatforms.length === 0) {
      toast({
        title: "Incomplete Post",
        description: "Please add content and select at least one platform",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const platform of selectedPlatforms) {
        const { error } = await supabase
          .from('social_media_posting_queue')
          .insert({
            content_id: crypto.randomUUID(),
            platform,
            scheduled_time: scheduleDate?.toISOString() || new Date().toISOString(),
            status: 'scheduled',
            platform_post_id: postContent
          });

        if (error) throw error;
      }

      toast({
        title: "Post Scheduled",
        description: `Content scheduled for ${selectedPlatforms.length} platform(s)`,
      });

      setPostContent('');
      setSelectedPlatforms([]);
      setScheduleDate(undefined);
      setComposerOpen(false);
      loadScheduledPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule post",
        variant: "destructive"
      });
    }
  };

  const getAccountForPlatform = (platform: string) => {
    return accounts.find(account => account.platform === platform);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <WifiOff className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPostStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'secondary',
      posting: 'default',
      posted: 'default',
      failed: 'destructive'
    };
    return variants[status] || 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Share2 className="h-8 w-8 animate-pulse text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Social Hub</p>
            <p className="text-sm text-muted-foreground">Connecting to your social accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Professional Social Hub
          </h2>
          <p className="text-muted-foreground">
            Manage all your social media accounts and content from one powerful dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
            <DialogTrigger asChild>
              <Button className="hover-scale">
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create & Schedule Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Content Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Post Content</label>
                  <Textarea
                    placeholder="What's happening? Share your family safety insights..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{postContent.length} characters</span>
                    <span>{280 - postContent.length} remaining</span>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Platforms</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(platformConfigs).map(([platform, config]) => {
                      const account = getAccountForPlatform(platform);
                      const isConnected = account?.connection_status === 'connected';
                      const isSelected = selectedPlatforms.includes(platform);
                      
                      return (
                        <Button
                          key={platform}
                          variant={isSelected ? "default" : "outline"}
                          className={`justify-start ${!isConnected ? 'opacity-50' : ''}`}
                          disabled={!isConnected}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                            } else {
                              setSelectedPlatforms([...selectedPlatforms, platform]);
                            }
                          }}
                        >
                          <config.icon className="h-4 w-4 mr-2" style={{ color: config.color }} />
                          {config.name}
                          {isConnected && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduling Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule Date & Time</label>
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={scheduleDate?.toISOString().slice(0, 16) || ''}
                        onChange={(e) => setScheduleDate(new Date(e.target.value))}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Optimization</label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={autoOptimize}
                        onCheckedChange={setAutoOptimize}
                      />
                      <span className="text-sm">Auto-optimize timing</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setComposerOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={schedulePost} disabled={!postContent.trim() || selectedPlatforms.length === 0}>
                      {scheduleDate ? (
                        <>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Schedule Post
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="hover-scale" onClick={loadAccounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Connected</p>
                <p className="text-2xl font-bold text-green-900">
                  {accounts.filter(a => a.connection_status === 'connected').length}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Errors</p>
                <p className="text-2xl font-bold text-red-900">
                  {accounts.filter(a => a.connection_status === 'error').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">
                  {scheduledPosts.filter(p => p.status === 'scheduled').length}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">This Month</p>
                <p className="text-2xl font-bold text-purple-900">
                  {accounts.reduce((sum, acc) => sum + (acc.metrics?.posts_this_month || 0), 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Avg. Engagement</p>
                <p className="text-2xl font-bold text-orange-900">
                  {(accounts.reduce((sum, acc) => sum + (acc.metrics?.engagement_rate || 0), 0) / Math.max(accounts.length, 1)).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(platformConfigs).map(([platform, config]) => {
              const account = getAccountForPlatform(platform);
              const Icon = config.icon;
              const isConnected = account?.connection_status === 'connected';
              const isConnecting = connecting === platform;

              return (
                <Card key={platform} className={`relative border-l-4 transition-all duration-300 ${isConnected ? 'border-l-green-500 bg-green-50/30' : 'border-l-gray-300'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="p-3 rounded-lg bg-gradient-to-br from-background to-muted"
                          style={{ borderColor: config.color }}
                        >
                          <Icon 
                            className="h-6 w-6"
                            style={{ color: config.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{config.name}</h3>
                            {getStatusIcon(account?.connection_status || 'disconnected')}
                            {isConnected && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Connected
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {config.description}
                          </p>
                          
                          {/* Platform Features */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {config.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>

                          {/* Account Metrics */}
                          {isConnected && account?.metrics && (
                            <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                              <div className="text-center">
                                <p className="font-semibold text-blue-600">{account.metrics.followers.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Followers</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-green-600">{account.metrics.posts_this_month}</p>
                                <p className="text-xs text-muted-foreground">Posts</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-purple-600">{account.metrics.engagement_rate.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Engagement</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-orange-600">{account.metrics.reach.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Reach</p>
                              </div>
                            </div>
                          )}

                          {account?.platform_name && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Connected as: <span className="font-medium">{account.platform_name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAccount(account)}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disconnectAccount(account.id, platform)}
                            >
                              <Unlink className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          </>
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
                                <Plus className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Scheduled Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Scheduled Posts ({scheduledPosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No scheduled posts</h3>
              <p className="text-muted-foreground mb-4">
                Create and schedule your first post to see it here
              </p>
              <Button onClick={() => setComposerOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <Card key={post.id} className="border-l-4 border-l-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center">
                            {React.createElement(platformConfigs[post.platform]?.icon || Share2, { 
                              className: "h-3 w-3",
                              style: { color: platformConfigs[post.platform]?.color }
                            })}
                          </div>
                          <Badge variant="outline">{post.platform}</Badge>
                          <Badge variant={getPostStatusBadge(post.status) as any}>{post.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.scheduled_time).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm line-clamp-2 mb-3">
                          {post.content}
                        </p>
                        
                        {post.media_url && (
                          <div className="mt-2">
                            <img 
                              src={post.media_url} 
                              alt="Post media" 
                              className="rounded-lg max-w-xs h-auto border border-border"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        {post.status === 'scheduled' && (
                          <>
                            <Button variant="outline" size="sm">
                              <PauseCircle className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                            <Button variant="outline" size="sm">
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Post Now
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalSocialHub;