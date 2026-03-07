import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  Brain,
  FileText,
  Image,
  Stars,
  Eye
} from 'lucide-react';

interface WorkflowStage {
  id: string;
  campaign_id: string;
  stage_name: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  output_data?: any;
  error_message?: string;
}

interface RealTimeWorkflowVisualizerProps {
  campaignId: string;
  workflow: WorkflowStage[];
}

export const RealTimeWorkflowVisualizer: React.FC<RealTimeWorkflowVisualizerProps> = ({
  campaignId,
  workflow
}) => {
  const stageConfig = [
    {
      name: 'command_analysis',
      label: 'Command Analysis',
      icon: Brain,
      description: 'AI analyzing your marketing command',
      color: 'blue'
    },
    {
      name: 'content_creation',
      label: 'Content Creation',
      icon: FileText,
      description: 'Generating high-quality content',
      color: 'purple'
    },
    {
      name: 'image_generation',
      label: 'Image Generation',
      icon: Image,
      description: 'Creating visual assets',
      color: 'green'
    },
    {
      name: 'quality_assembly',
      label: 'Quality Assembly',
      icon: Stars,
      description: 'Optimizing and finalizing content',
      color: 'orange'
    },
    {
      name: 'approval_ready',
      label: 'Ready for Approval',
      icon: Eye,
      description: 'Content ready for review',
      color: 'teal'
    }
  ];

  const getStageStatus = (stageName: string) => {
    return workflow.find(stage => stage.stage_name === stageName);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-primary animate-pulse" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getProgressValue = () => {
    if (workflow.length === 0) return 0;
    const completed = workflow.filter(stage => stage.status === 'completed').length;
    return (completed / workflow.length) * 100;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (workflow.length === 0) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="p-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Waiting for workflow to start...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background/50 to-muted/30 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            Live Workflow Progress
          </span>
          <div className="flex items-center gap-2">
            <Progress value={getProgressValue()} className="w-32" />
            <span className="text-sm text-muted-foreground">
              {Math.round(getProgressValue())}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stageConfig.map((config, index) => {
            const stageStatus = getStageStatus(config.name);
            const status = stageStatus?.status || 'pending';
            const StageIcon = config.icon;

            return (
              <div key={config.name} className="relative">
                <Card className={`
                  transition-all duration-300 hover:shadow-lg
                  ${status === 'in_progress' ? 'ring-2 ring-primary/50 shadow-lg' : ''}
                  ${status === 'completed' ? 'bg-green-50/50 border-green-200' : ''}
                  ${status === 'failed' ? 'bg-red-50/50 border-red-200' : ''}
                `}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <StageIcon className={`h-5 w-5 ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'in_progress' ? 'text-primary' :
                        status === 'failed' ? 'text-red-600' :
                        'text-muted-foreground'
                      }`} />
                      {getStatusIcon(status)}
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">{config.label}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.description}
                    </p>
                    
                    {getStatusBadge(status)}
                    
                    {stageStatus?.started_at && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Started: {formatTimestamp(stageStatus.started_at)}
                      </div>
                    )}
                    
                    {stageStatus?.completed_at && (
                      <div className="text-xs text-green-600 mt-1">
                        Completed: {formatTimestamp(stageStatus.completed_at)}
                      </div>
                    )}
                    
                    {stageStatus?.error_message && (
                      <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded">
                        {stageStatus.error_message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Flow Arrow */}
                {index < stageConfig.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className={`h-0.5 w-4 ${
                      status === 'completed' ? 'bg-green-500' : 
                      status === 'in_progress' ? 'bg-primary' : 
                      'bg-muted-foreground/30'
                    }`} />
                    <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-2 border-t border-b border-transparent ${
                      status === 'completed' ? 'border-l-green-500' : 
                      status === 'in_progress' ? 'border-l-primary' : 
                      'border-l-muted-foreground/30'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Output Display */}
        {workflow.some(stage => stage.output_data) && (
          <Card className="mt-6 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">Live Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {workflow
                  .filter(stage => stage.output_data)
                  .map(stage => (
                    <div key={stage.id} className="text-xs p-2 bg-background rounded border">
                      <span className="font-medium text-primary">
                        {stage.stage_name.replace('_', ' ')}:
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {typeof stage.output_data === 'string' 
                          ? stage.output_data 
                          : JSON.stringify(stage.output_data).substring(0, 100) + '...'
                        }
                      </span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};