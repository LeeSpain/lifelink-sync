import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Filter, MessageSquare, Shield, Users, TrendingUp, FileText } from 'lucide-react';
import { useCustomerActivity } from '@/hooks/useCustomerActivity';
import { format } from 'date-fns';

interface ActivityTimelineProps {
  customerId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ customerId }) => {
  const [category, setCategory] = useState('all');
  const { data, isLoading } = useCustomerActivity({ customerId, category, limit: 50 });

  const getIcon = (type: string) => {
    switch (type) {
      case 'subscription': return <TrendingUp className="h-4 w-4" />;
      case 'note': return <MessageSquare className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'contact': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'subscription': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'note': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'security': return 'bg-red-500/10 text-red-700 dark:text-red-300';
      case 'contact': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="subscription">Subscriptions</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="contact">Contacts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.activities && data.activities.length > 0 ? (
            data.activities.map((activity, index) => (
              <div key={activity.id} className="relative pl-6 pb-4 border-l-2 border-border">
                <div className="absolute -left-3 top-0 rounded-full bg-background border-2 border-border p-1">
                  {getIcon(activity.type)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge variant="outline" className={getCategoryColor(activity.category)}>
                      {activity.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activity.timestamp), 'PPp')}
                    </span>
                    {activity.user && <span>by {activity.user}</span>}
                  </div>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activities found
            </div>
          )}
          {data?.hasMore && (
            <Button variant="outline" className="w-full" disabled>
              Load More
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};