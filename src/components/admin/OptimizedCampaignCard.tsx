import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Play, Pause, Square } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  error_message?: string;
  completed_at?: string;
}

interface OptimizedCampaignCardProps {
  campaign: Campaign;
  onRetry: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isLoading?: boolean;
}

const OptimizedCampaignCard = memo(({ campaign, onRetry, onStatusChange, isLoading }: OptimizedCampaignCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusActions = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(campaign.id, 'paused')}
            disabled={isLoading}
          >
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </Button>
        );
      case 'paused':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(campaign.id, 'running')}
            disabled={isLoading}
          >
            <Play className="h-3 w-3 mr-1" />
            Resume
          </Button>
        );
      case 'failed':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry(campaign.id)}
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold truncate flex-1 text-sm">
            {campaign.title}
          </h4>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(campaign.status)} className="text-xs">
              {campaign.status}
            </Badge>
            {campaign.status === 'running' && (
              <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full" />
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {campaign.description}
        </p>
        
        {campaign.error_message && (
          <div className="bg-destructive/10 text-destructive text-xs p-2 rounded mb-3">
            <strong>Error:</strong> {campaign.error_message}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(campaign.created_at).toLocaleDateString()}
            {campaign.completed_at && (
              <span className="ml-2">
                | Done: {new Date(campaign.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {getStatusActions(campaign.status)}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedCampaignCard.displayName = 'OptimizedCampaignCard';

export default OptimizedCampaignCard;