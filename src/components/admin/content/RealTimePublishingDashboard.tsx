import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  Calendar,
  Eye,
  Share2,
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  MousePointer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PublishingStatusProps {
  content: any[];
  onBulkAction: (action: string, items: string[]) => void;
}

interface StatusCounts {
  queued: number;
  processing: number;
  posted: number;
  failed: number;
}

interface EngagementMetrics {
  id: string;
  title: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

const RealTimePublishingDashboard: React.FC<PublishingStatusProps> = ({ content, onBulkAction }) => {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    queued: 0,
    processing: 0,
    posted: 0,
    failed: 0
  });
  const [analytics, setAnalytics] = useState<EngagementMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  // Real-time status updates
  useEffect(() => {
    const updateStatusCounts = () => {
      const counts = content.reduce((acc, item) => {
        const status = item.status?.toLowerCase() || 'queued';
        if (status.includes('queue') || status.includes('scheduled')) acc.queued++;
        else if (status.includes('posting') || status.includes('processing')) acc.processing++;
        else if (status.includes('posted') || status.includes('published')) acc.posted++;
        else if (status.includes('failed') || status.includes('error')) acc.failed++;
        return acc;
      }, { queued: 0, processing: 0, posted: 0, failed: 0 });
      
      setStatusCounts(counts);
    };

    updateStatusCounts();
    const interval = setInterval(updateStatusCounts, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [content]);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data, error } = await supabase
          .from('marketing_analytics')
          .select(`
            content_id,
            platform,
            metric_type,
            metric_value,
            marketing_content (title)
          `)
          .order('recorded_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Group analytics by content
        const grouped = data?.reduce((acc: Record<string, any>, item: any) => {
          const contentId = item.content_id;
          if (!acc[contentId]) {
            acc[contentId] = {
              id: contentId,
              title: item.marketing_content?.title || 'Untitled',
              platform: item.platform,
              views: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              clicks: 0
            };
          }
          acc[contentId][item.metric_type] = (acc[contentId][item.metric_type] || 0) + (item.metric_value || 0);
          return acc;
        }, {});

        setAnalytics(Object.values(grouped || {}));
      } catch (error: any) {
        console.error('Failed to load analytics:', error);
      }
    };

    loadAnalytics();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(content.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onBulkAction(action, selectedItems);
      setSelectedItems([]);
      toast({
        title: "Bulk action completed",
        description: `${action} applied to ${selectedItems.length} items.`,
      });
    } catch (error: any) {
      toast({
        title: "Bulk action failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('posted') || s.includes('published')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s.includes('failed') || s.includes('error')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (s.includes('processing') || s.includes('posting')) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('posted') || s.includes('published')) return <Badge variant="default" className="bg-green-500">Published</Badge>;
    if (s.includes('failed') || s.includes('error')) return <Badge variant="destructive">Failed</Badge>;
    if (s.includes('processing') || s.includes('posting')) return <Badge variant="secondary">Processing</Badge>;
    return <Badge variant="outline">Queued</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queued</p>
                <p className="text-2xl font-bold">{statusCounts.queued}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <Progress value={(statusCounts.queued / content.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{statusCounts.processing}</p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <Progress value={(statusCounts.processing / content.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{statusCounts.posted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={(statusCounts.posted / content.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{statusCounts.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <Progress value={(statusCounts.failed / content.length) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bulk Actions</CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedItems.length === content.length && content.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Select All ({selectedItems.length} selected)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  disabled={loading || selectedItems.length === 0}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('schedule')}
                  disabled={loading || selectedItems.length === 0}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('publish_now')}
                  disabled={loading || selectedItems.length === 0}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Publish Now
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={loading || selectedItems.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content List with Real-time Status */}
          <div className="space-y-2">
            {content.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <h3 className="font-medium truncate">{item.title || 'Untitled'}</h3>
                      <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.body_text?.slice(0, 100)}...
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(item.status)}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Engagement Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No analytics data available yet. Publish some content to see engagement metrics.
                  </p>
                ) : (
                  analytics.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge variant="outline">{item.platform}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span>{item.views.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>{item.likes.toLocaleString()} likes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span>{item.comments.toLocaleString()} comments</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Share2 className="w-4 h-4 text-purple-500" />
                          <span>{item.shares.toLocaleString()} shares</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MousePointer className="w-4 h-4 text-orange-500" />
                          <span>{item.clicks.toLocaleString()} clicks</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimePublishingDashboard;