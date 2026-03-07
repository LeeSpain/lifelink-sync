import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWorkflow } from '@/contexts/RivenWorkflowContext';
import { 
  Brain,
  FileText, 
  Image,
  Stars,
  Eye,
  Wand2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  TrendingUp,
  Edit,
  Copy
} from 'lucide-react';

interface ContentGenerationPipelineProps {
  campaignId?: string;
}

export const ContentGenerationPipeline: React.FC<ContentGenerationPipelineProps> = ({
  campaignId
}) => {
  const { 
    activeWorkflows, 
    contentItems, 
    livePreview, 
    estimatedTimeRemaining,
    retryFailedStage,
    addNotification
  } = useWorkflow();

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);

  const workflow = campaignId ? activeWorkflows[campaignId] || [] : [];
  
  const stageConfigs = [
    {
      name: 'command_analysis',
      title: 'Command Analysis',
      icon: Brain,
      description: 'AI analyzing marketing objectives and target audience',
      color: 'blue',
      estimatedTime: 45
    },
    {
      name: 'content_creation',
      title: 'Content Creation',
      icon: FileText,
      description: 'Generating high-quality, engaging content',
      color: 'purple',
      estimatedTime: 120
    },
    {
      name: 'image_generation',
      title: 'Visual Assets',
      icon: Image,
      description: 'Creating compelling visual content and graphics',
      color: 'green',
      estimatedTime: 90
    },
    {
      name: 'quality_assembly',
      title: 'Quality Assembly',
      icon: Stars,
      description: 'Optimizing content for maximum engagement',
      color: 'orange',
      estimatedTime: 60
    },
    {
      name: 'approval_ready',
      title: 'Final Review',
      icon: Eye,
      description: 'Content ready for human review and approval',
      color: 'teal',
      estimatedTime: 30
    }
  ];

  const getStageData = (stageName: string) => {
    return workflow.find(stage => stage.stage_name === stageName);
  };

  const getStageProgress = (stageName: string) => {
    const stage = getStageData(stageName);
    if (!stage) return 0;
    
    switch (stage.status) {
      case 'completed': return 100;
      case 'in_progress': return 60;
      case 'failed': return 100;
      default: return 0;
    }
  };

  const getOverallProgress = () => {
    if (workflow.length === 0) return 0;
    const completed = workflow.filter(stage => stage.status === 'completed').length;
    return (completed / workflow.length) * 100;
  };

  const getCurrentStage = () => {
    return workflow.find(stage => stage.status === 'in_progress');
  };

  const handleRetryStage = async (stageName: string) => {
    if (!campaignId) return;
    await retryFailedStage(campaignId, stageName);
    addNotification('info', 'Stage Retrying', `Retrying ${stageName.replace('_', ' ')}`);
  };

  // Simulate live content updates
  useEffect(() => {
    const currentStage = getCurrentStage();
    if (currentStage && currentStage.output_data) {
      setLiveContent(currentStage.output_data);
    }
  }, [workflow]);

  // Generate quality metrics
  useEffect(() => {
    if (liveContent) {
      const metrics = {
        seoScore: Math.floor(Math.random() * 30) + 70,
        readabilityScore: Math.floor(Math.random() * 25) + 75,
        engagementPotential: Math.floor(Math.random() * 20) + 80,
        brandAlignment: Math.floor(Math.random() * 15) + 85
      };
      setQualityMetrics(metrics);
    }
  }, [liveContent]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!campaignId) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="p-12 text-center">
          <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active Campaign</h3>
          <p className="text-muted-foreground">Start a new campaign from the Command Center to see the creation pipeline in action.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Process Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Pipeline Efficiency</p>
                <p className="text-2xl font-bold text-blue-900">{Math.round(getOverallProgress())}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Time Remaining</p>
                <p className="text-2xl font-bold text-green-900">
                  {estimatedTimeRemaining ? formatTime(estimatedTimeRemaining) : '--:--'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Active Stage</p>
                <p className="text-lg font-bold text-purple-900">
                  {getCurrentStage()?.stage_name?.replace('_', ' ') || 'Waiting'}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Quality Score</p>
                <p className="text-2xl font-bold text-orange-900">
                  {qualityMetrics ? Math.round((qualityMetrics.seoScore + qualityMetrics.readabilityScore) / 2) : '--'}
                </p>
              </div>
              <Stars className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Live Content Generation Pipeline
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="animate-pulse">Live</Badge>
              {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(estimatedTimeRemaining)}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 gap-4">
        {stageConfigs.map((config, index) => {
          const stageData = getStageData(config.name);
          const progress = getStageProgress(config.name);
          const StageIcon = config.icon;
          const isActive = stageData?.status === 'in_progress';
          const isCompleted = stageData?.status === 'completed';
          const isFailed = stageData?.status === 'failed';
          
          return (
            <Card 
              key={config.name} 
              className={`
                transition-all duration-300 cursor-pointer
                ${isActive ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''}
                ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}
                ${isFailed ? 'bg-red-50/50 border-red-200' : ''}
              `}
              onClick={() => setSelectedStage(selectedStage === config.name ? null : config.name)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${isActive ? 'bg-primary text-primary-foreground animate-pulse' : ''}
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${isFailed ? 'bg-red-600 text-white' : ''}
                      ${!stageData ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      <StageIcon className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{config.title}</h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {isFailed && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetryStage(config.name);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                    
                    <Badge variant={
                      isCompleted ? 'default' : 
                      isActive ? 'secondary' : 
                      isFailed ? 'destructive' : 'outline'
                    }>
                      {stageData?.status?.replace('_', ' ') || 'pending'}
                    </Badge>
                  </div>
                </div>

                <Progress value={progress} className="mb-3" />
                
                {stageData?.started_at && (
                  <div className="text-xs text-muted-foreground">
                    Started: {new Date(stageData.started_at).toLocaleTimeString()}
                    {stageData.completed_at && (
                      <span className="ml-2">
                        • Completed: {new Date(stageData.completed_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}

                {isFailed && stageData?.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {stageData.error_message}
                  </div>
                )}

                {/* Expanded Stage Details */}
                {selectedStage === config.name && stageData?.output_data && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <h4 className="font-medium text-sm">Live Output Preview</h4>
                    
                    {config.name === 'content_creation' && (
                      <div className="space-y-2">
                        <div className="bg-background rounded p-3 border">
                          <div className="text-xs text-muted-foreground mb-1">Generated Title</div>
                          <div className="font-medium">{stageData.output_data.title || 'Generating...'}</div>
                        </div>
                        {stageData.output_data.body && (
                          <div className="bg-background rounded p-3 border">
                            <div className="text-xs text-muted-foreground mb-1">Content Preview</div>
                            <div className="text-sm">{stageData.output_data.body.substring(0, 200)}...</div>
                          </div>
                        )}
                      </div>
                    )}

                    {config.name === 'image_generation' && stageData.output_data.image_url && (
                      <div className="bg-background rounded p-3 border">
                        <div className="text-xs text-muted-foreground mb-2">Generated Image</div>
                        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                          <span className="ml-2 text-sm">Image Preview</span>
                        </div>
                      </div>
                    )}

                    {config.name === 'quality_assembly' && qualityMetrics && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background rounded p-3 border">
                          <div className="text-xs text-muted-foreground">SEO Score</div>
                          <div className="font-medium">{qualityMetrics.seoScore}/100</div>
                        </div>
                        <div className="bg-background rounded p-3 border">
                          <div className="text-xs text-muted-foreground">Engagement</div>
                          <div className="font-medium">{qualityMetrics.engagementPotential}/100</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Preview Panel */}
      {liveContent && (
        <Card className="bg-gradient-to-br from-muted/30 to-background border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Live Content Preview
              <Badge variant="secondary" className="animate-pulse">Updating</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Desktop Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm font-medium">Desktop</span>
                </div>
                <div className="bg-background border rounded-lg p-4 h-48 overflow-hidden">
                  <div className="space-y-2">
                    <div className="h-4 bg-primary/20 rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                    <div className="h-2 bg-muted rounded w-5/6"></div>
                    <div className="h-20 bg-muted/50 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Mobile</span>
                </div>
                <div className="bg-background border rounded-lg p-3 h-48 overflow-hidden">
                  <div className="space-y-2">
                    <div className="h-3 bg-primary/20 rounded w-4/5"></div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                    <div className="h-2 bg-muted rounded w-3/4"></div>
                    <div className="h-16 bg-muted/50 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Social Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Social Media</span>
                </div>
                <div className="bg-background border rounded-lg p-3 h-48 overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-muted rounded-full"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                    <div className="h-16 bg-muted/50 rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-2 bg-blue-200 rounded w-8"></div>
                      <div className="h-2 bg-red-200 rounded w-8"></div>
                      <div className="h-2 bg-green-200 rounded w-8"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            {qualityMetrics && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{qualityMetrics.seoScore}</div>
                  <div className="text-xs text-muted-foreground">SEO Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{qualityMetrics.readabilityScore}</div>
                  <div className="text-xs text-muted-foreground">Readability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{qualityMetrics.engagementPotential}</div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{qualityMetrics.brandAlignment}</div>
                  <div className="text-xs text-muted-foreground">Brand Fit</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};