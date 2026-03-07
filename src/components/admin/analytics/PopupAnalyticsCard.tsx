import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MousePointer, TrendingUp, CheckCircle, X } from 'lucide-react';
import { usePopupAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Progress } from '@/components/ui/progress';

interface PopupAnalyticsCardProps {
  timeRange: string;
}

export const PopupAnalyticsCard: React.FC<PopupAnalyticsCardProps> = ({ timeRange }) => {
  const { data: popupData, isLoading } = usePopupAnalytics(timeRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Popup Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPopupDisplayName = (type: string) => {
    switch (type) {
      case 'first_visit_preferences':
        return 'First Visit Preferences';
      case 'free_trial':
        return 'Free Trial Popup';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getPopupIcon = (conversionRate: number) => {
    if (conversionRate >= 70) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (conversionRate >= 40) return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    return <X className="w-4 h-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointer className="w-5 h-5" />
          Popup Performance
        </CardTitle>
        <CardDescription>
          Modal and popup conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!popupData || popupData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No popup interaction data available
          </div>
        ) : (
          <div className="space-y-6">
            {popupData.map((popup) => (
              <div key={popup.popupType} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPopupIcon(popup.conversionRate)}
                    <span className="font-medium">
                      {getPopupDisplayName(popup.popupType)}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold text-lg">
                      {popup.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-muted-foreground text-xs">
                      conversion rate
                    </div>
                  </div>
                </div>
                
                <Progress value={popup.conversionRate} className="h-2" />
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {popup.totalShown}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Shown
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">
                      {popup.totalCompleted}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">
                      {popup.totalDismissed}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Dismissed
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};