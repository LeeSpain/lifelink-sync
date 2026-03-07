import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Eye } from 'lucide-react';
import { useGeographicAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GeographicAnalyticsCardProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const GeographicAnalyticsCard: React.FC<GeographicAnalyticsCardProps> = ({
  timeRange = '90d', // Set default to 90d to include all historical data including Netherlands
  onTimeRangeChange
}) => {
  const effectiveTimeRange = timeRange || '90d';
  const { data: geoData, isLoading } = useGeographicAnalytics(effectiveTimeRange);
  
  console.log('GeographicAnalyticsCard: Time range:', effectiveTimeRange, 'Data:', geoData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = geoData?.reduce((sum, geo) => sum + geo.visitors, 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic Distribution
          </CardTitle>
          <CardDescription>
            Visitors by location ({totalVisitors} total)
          </CardDescription>
        </div>
        <Select value={effectiveTimeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="60d">60 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!geoData || geoData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No geographic data available for this time period
          </div>
        ) : (
          <div className="space-y-4">
            {geoData.slice(0, 10).map((geo, index) => {
              const percentage = totalVisitors > 0 ? (geo.visitors / totalVisitors) * 100 : 0;
              
              return (
                <div key={`${geo.country}-${geo.region}-${geo.city}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{index + 1}</span>
                      <div>
                        <div className="font-medium">
                          {geo.city}, {geo.region}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {geo.country}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{geo.visitors}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        <span>{geo.pageViews} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% of total visitors
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};