import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInteractionAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { MousePointer, Eye, Hand } from 'lucide-react';

interface InteractionAnalyticsCardProps {
  timeRange: string;
}

export function InteractionAnalyticsCard({ timeRange }: InteractionAnalyticsCardProps) {
  const { data: interactionData, isLoading } = useInteractionAnalytics(timeRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Interactions</CardTitle>
          <CardDescription>Breakdown of user interaction events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getInteractionIcon = (eventType: string) => {
    if (eventType.includes('click')) return <MousePointer className="h-4 w-4" />;
    if (eventType.includes('view')) return <Eye className="h-4 w-4" />;
    return <Hand className="h-4 w-4" />;
  };

  const getDisplayName = (eventType: string) => {
    const names: Record<string, string> = {
      'link_click': 'Link Clicks',
      'element_click': 'Element Clicks', 
      'button_click': 'Button Clicks',
      'scroll': 'Scroll Events',
      'hover': 'Hover Events'
    };
    return names[eventType] || eventType.replace('_', ' ').toUpperCase();
  };

  const totalInteractions = interactionData?.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="h-5 w-5" />
          User Interactions
        </CardTitle>
        <CardDescription>
          Breakdown of user interaction events for the selected time period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!interactionData || interactionData.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No interaction data available for this time period.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total interactions: <Badge variant="secondary">{totalInteractions}</Badge>
            </div>
            
            <div className="space-y-3">
              {interactionData.slice(0, 10).map((interaction) => (
                <div key={interaction.eventType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getInteractionIcon(interaction.eventType)}
                    <span className="font-medium">{getDisplayName(interaction.eventType)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{interaction.count}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {totalInteractions > 0 ? 
                        `${((interaction.count / totalInteractions) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {interactionData.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Top pages for interactions:
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {interactionData[0]?.topPages?.slice(0, 3).map((page, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {page || '/'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}