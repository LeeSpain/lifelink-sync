import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Activity } from 'lucide-react';
import { useHourlyAnalytics } from '@/hooks/useAdvancedAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HourlyAnalyticsChartProps {
  timeRange?: string;
}

export const HourlyAnalyticsChart: React.FC<HourlyAnalyticsChartProps> = ({ timeRange }) => {
  const { data: hourlyData, isLoading } = useHourlyAnalytics();
  
  console.log('HourlyAnalyticsChart: Time range:', timeRange, 'Data:', hourlyData?.length);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            24-Hour Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const chartData = hourlyData?.map(hour => ({
    hour: formatHour(hour.hour),
    pageViews: hour.pageViews,
    interactions: hour.interactions,
    uniqueVisitors: hour.uniqueVisitors
  })) || [];

  const totalPageViews = hourlyData?.reduce((sum, hour) => sum + hour.pageViews, 0) || 0;
  const totalInteractions = hourlyData?.reduce((sum, hour) => sum + hour.interactions, 0) || 0;
  const maxVisitors = Math.max(...(hourlyData?.map(h => h.uniqueVisitors) || [0]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          24-Hour Activity
        </CardTitle>
        <CardDescription>
          Real-time visitor activity over the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalPageViews}</div>
            <div className="text-sm text-muted-foreground">Page Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalInteractions}</div>
            <div className="text-sm text-muted-foreground">Interactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{maxVisitors}</div>
            <div className="text-sm text-muted-foreground">Peak Visitors/Hour</div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="pageViews" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Page Views"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="interactions" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                name="Interactions"
                dot={{ fill: 'hsl(142, 76%, 36%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="uniqueVisitors" 
                stroke="hsl(258, 90%, 66%)" 
                strokeWidth={2}
                name="Unique Visitors"
                dot={{ fill: 'hsl(258, 90%, 66%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};