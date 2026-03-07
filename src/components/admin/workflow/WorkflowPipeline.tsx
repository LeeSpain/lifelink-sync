import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Brain, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Zap,
  Eye,
  Lightbulb,
  Palette,
  Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStage {
  id: string;
  campaign_id: string;
  stage_name: string;
  stage_order: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  output_data: any;
  metadata: any;
  error_message?: string;
}

interface WorkflowPipelineProps {
  campaignId?: string;
  isVisible?: boolean;
}

const WORKFLOW_STAGES = [
  {
    name: 'command_analysis',
    title: 'Command Analysis',
    icon: Brain,
    description: 'AI analyzing your marketing command and extracting strategy',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    name: 'content_creation',
    title: 'Content Creation',
    icon: FileText,
    description: 'Generating compelling copy and SEO-optimized content',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    name: 'image_generation',
    title: 'Image Generation',
    icon: ImageIcon,
    description: 'Creating stunning visuals to accompany your content',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    name: 'quality_assembly',
    title: 'Quality Assembly',
    icon: Layers,
    description: 'Combining content and visuals with final quality checks',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    name: 'approval_ready',
    title: 'Ready for Approval',
    icon: CheckCircle,
    description: 'Content package ready for your review and approval',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  }
];

export default function WorkflowPipeline({ campaignId, isVisible = true }: WorkflowPipelineProps) {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentActiveStage, setCurrentActiveStage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (campaignId && isVisible) {
      loadWorkflowStages();
      setupRealtimeSubscription();
    }
  }, [campaignId, isVisible]);

  const loadWorkflowStages = async () => {
    if (!campaignId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_stages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('stage_order');

      if (error) throw error;

      setStages(data || []);
      
      // Find current active stage
      const activeStage = data?.find(stage => stage.status === 'in_progress');
      setCurrentActiveStage(activeStage?.stage_name || null);
    } catch (error) {
      console.error('Error loading workflow stages:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow stages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`workflow-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_stages',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          console.log('Workflow stage update:', payload);
          loadWorkflowStages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStageStatus = (stageName: string) => {
    const stage = stages.find(s => s.stage_name === stageName);
    return stage?.status || 'pending';
  };

  const getStageData = (stageName: string) => {
    const stage = stages.find(s => s.stage_name === stageName);
    return stage?.output_data || {};
  };

  const getStageIcon = (stage: any, status: string) => {
    const IconComponent = stage.icon;
    
    if (status === 'in_progress') {
      return <Zap className={`h-6 w-6 ${stage.color} animate-pulse`} />;
    } else if (status === 'completed') {
      return <CheckCircle className="h-6 w-6 text-emerald-500" />;
    } else if (status === 'failed') {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    } else {
      return <IconComponent className={`h-6 w-6 ${status === 'pending' ? 'text-muted-foreground' : stage.color}`} />;
    }
  };

  const getProgressPercentage = () => {
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const totalStages = WORKFLOW_STAGES.length;
    return Math.round((completedStages / totalStages) * 100);
  };

  const renderStageContent = (stage: any, status: string, stageData: any) => {
    if (status === 'pending') {
      return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Waiting to start...
        </div>
      );
    }

    if (status === 'in_progress') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            AI Agent Working...
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-current rounded-full animate-pulse w-3/4 transition-all duration-1000"></div>
          </div>
        </div>
      );
    }

    if (status === 'completed' && stageData) {
      switch (stage.name) {
        case 'command_analysis':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Analysis Complete
              </div>
              {stageData.strategy && (
                <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                  <strong>Strategy:</strong> {stageData.strategy.substring(0, 100)}...
                </div>
              )}
              {stageData.target_platforms && (
                <div className="flex gap-1 flex-wrap">
                  {stageData.target_platforms.map((platform: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{platform}</Badge>
                  ))}
                </div>
              )}
            </div>
          );
        
        case 'content_creation':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Content Ready
              </div>
              {stageData.title && (
                <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                  <strong>Title:</strong> {stageData.title.substring(0, 80)}...
                </div>
              )}
              {stageData.word_count && (
                <Badge variant="outline" className="text-xs">
                  {stageData.word_count} words
                </Badge>
              )}
              {stageData.seo_score && (
                <Badge variant="outline" className="text-xs">
                  SEO: {stageData.seo_score}/100
                </Badge>
              )}
            </div>
          );
        
        case 'image_generation':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Image Created
              </div>
              {stageData.image_url && (
                <div className="bg-white/50 p-2 rounded">
                  <img 
                    src={stageData.image_url} 
                    alt="Generated"
                    className="w-full h-20 object-cover rounded"
                  />
                </div>
              )}
              {stageData.image_prompt && (
                <div className="text-xs text-muted-foreground">
                  <strong>Prompt:</strong> {stageData.image_prompt.substring(0, 60)}...
                </div>
              )}
            </div>
          );
        
        case 'quality_assembly':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Assembly Complete
              </div>
              {stageData.quality_score && (
                <Badge variant="outline" className="text-xs">
                  Quality Score: {stageData.quality_score}/100
                </Badge>
              )}
              <div className="text-xs text-muted-foreground">
                Content optimized and ready for review
              </div>
            </div>
          );
        
        case 'approval_ready':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Ready for Review
              </div>
              <Button size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Review Content
              </Button>
            </div>
          );
        
        default:
          return (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              Stage Complete
            </div>
          );
      }
    }

    if (status === 'failed') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4" />
            Failed
          </div>
          <Button size="sm" variant="outline" className="w-full">
            Retry Stage
          </Button>
        </div>
      );
    }

    return null;
  };

  if (!isVisible || !campaignId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center space-y-2">
          <Bot className="h-12 w-12 mx-auto opacity-50" />
          <p>Execute a command to see the AI workflow in action</p>
        </div>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const hasActiveWorkflow = stages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Riven Creation Pipeline
          </h3>
          <p className="text-sm text-muted-foreground">
            Watch AI agents create your marketing content step by step
          </p>
        </div>
        {hasActiveWorkflow && (
          <div className="text-right">
            <div className="text-sm font-medium">{progress}% Complete</div>
            <Progress value={progress} className="w-24 h-2" />
          </div>
        )}
      </div>

      {/* Workflow Stages */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WORKFLOW_STAGES.map((stageConfig, index) => {
          const status = getStageStatus(stageConfig.name);
          const stageData = getStageData(stageConfig.name);
          const isActive = currentActiveStage === stageConfig.name;

          return (
            <Card 
              key={stageConfig.name}
              className={`transition-all duration-300 ${
                isActive ? 'ring-2 ring-primary shadow-lg' : ''
              } ${stageConfig.borderColor} ${stageConfig.bgColor}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStageIcon(stageConfig, status)}
                    <div className="text-sm font-medium">
                      Stage {index + 1}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      status === 'completed' ? 'default' :
                      status === 'in_progress' ? 'secondary' :
                      status === 'failed' ? 'destructive' : 'outline'
                    }
                    className="text-xs"
                  >
                    {status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-sm">{stageConfig.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">
                  {stageConfig.description}
                </p>
                {renderStageContent(stageConfig, status, stageData)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Activity */}
      {currentActiveStage && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">
                  AI Agent Currently Working
                </p>
                <p className="text-xs text-muted-foreground">
                  {WORKFLOW_STAGES.find(s => s.name === currentActiveStage)?.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}