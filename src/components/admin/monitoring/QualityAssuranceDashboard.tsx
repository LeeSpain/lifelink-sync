import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Clock, 
  Zap,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { usePublishingMonitoring } from '@/hooks/usePublishingMonitoring';
import { cn } from '@/lib/utils';

interface QualityAssuranceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function QualityAssuranceDashboard({ isOpen, onClose }: QualityAssuranceDashboardProps) {
  const { 
    metrics, 
    qualityTrends, 
    isLoading, 
    error, 
    retryFailedPublishing, 
    clearFailedItems,
    getHealthRecommendations,
    refreshMetrics 
  } = usePublishingMonitoring();

  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  if (!isOpen) return null;

  const handleRetry = async (activityId: string) => {
    const result = await retryFailedPublishing(activityId);
    if (result.success) {
      // Show success toast
    }
  };

  const handleClearFailed = async () => {
    const result = await clearFailedItems();
    if (result.success) {
      // Show success toast
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-success';
      case 'failed': return 'text-destructive';
      case 'processing': return 'text-warning';
      case 'pending': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    };
    return variants[status] || 'outline';
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading quality metrics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button onClick={refreshMetrics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto p-4 h-full overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Quality Assurance Dashboard</h1>
              <p className="text-muted-foreground">Monitor content quality and publishing performance</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshMetrics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                Close
              </Button>
            </div>
          </div>

          {metrics && (
            <div className="space-y-6">
              {/* System Health Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", {
                        'bg-success': metrics.systemHealth === 'healthy',
                        'bg-warning': metrics.systemHealth === 'degraded',
                        'bg-destructive': metrics.systemHealth === 'critical'
                      })} />
                      <span className={cn("font-semibold capitalize", getHealthColor(metrics.systemHealth))}>
                        {metrics.systemHealth}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {metrics.successRate.toFixed(1)}%
                    </div>
                    <Progress value={metrics.successRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.avgProcessingTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Last 7 days
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Published</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.totalPublished}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Content items
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="quality">Quality Trends</TabsTrigger>
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Platform Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Performance</CardTitle>
                      <CardDescription>Success rates and performance by platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-4">Success Rate by Platform</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={Object.entries(metrics.platformBreakdown).map(([platform, data]) => ({
                              platform,
                              successRate: (data.success / (data.success + data.failed)) * 100 || 0,
                              total: data.success + data.failed
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="platform" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="successRate" fill="hsl(var(--primary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-4">Processing Time by Platform</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={Object.entries(metrics.platformBreakdown).map(([platform, data]) => ({
                              platform,
                              avgTime: (data.avgTime / 1000) || 0
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="platform" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="avgTime" fill="hsl(var(--secondary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quality" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quality Score Trends</CardTitle>
                      <CardDescription>Content quality metrics over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={qualityTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Pass Rate</CardTitle>
                      <CardDescription>Percentage of content passing quality validation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={qualityTrends.map(trend => ({
                          ...trend,
                          passRate: (trend.passedValidation / trend.totalContent) * 100
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="passRate" stroke="hsl(var(--secondary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Recent Publishing Activity</CardTitle>
                        <CardDescription>Latest content publishing attempts</CardDescription>
                      </div>
                      <Button onClick={handleClearFailed} variant="outline" size="sm">
                        Clear Failed Items
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-3">
                          {metrics.recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {activity.status === 'published' && <CheckCircle className="h-4 w-4 text-success" />}
                                  {activity.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                                  {activity.status === 'processing' && <Clock className="h-4 w-4 text-warning" />}
                                  {activity.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                                  
                                  <Badge variant={getStatusBadge(activity.status)}>
                                    {activity.status}
                                  </Badge>
                                </div>

                                <div>
                                  <div className="font-medium">{activity.platform}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(activity.created_at).toLocaleString()}
                                  </div>
                                  {activity.error_message && (
                                    <div className="text-sm text-destructive mt-1">
                                      {activity.error_message}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {activity.processing_time_ms && (
                                  <span className="text-sm text-muted-foreground">
                                    {(activity.processing_time_ms / 1000).toFixed(1)}s
                                  </span>
                                )}
                                
                                {activity.retry_count > 0 && (
                                  <Badge variant="outline">
                                    Retry {activity.retry_count}
                                  </Badge>
                                )}

                                {activity.status === 'failed' && (
                                  <Button 
                                    onClick={() => handleRetry(activity.id)}
                                    variant="outline" 
                                    size="sm"
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Recommendations</CardTitle>
                      <CardDescription>Automated suggestions for improving performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getHealthRecommendations().map((recommendation, index) => (
                          <Alert key={index}>
                            <Zap className="h-4 w-4" />
                            <AlertDescription>{recommendation}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {qualityTrends.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Common Quality Issues</CardTitle>
                        <CardDescription>Most frequently occurring content quality issues</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {qualityTrends[qualityTrends.length - 1]?.topIssues.map((issue, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <span className="text-sm">{issue.issue}</span>
                            <Badge variant="outline">{issue.count}</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}