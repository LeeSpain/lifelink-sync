import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, MessageSquare, User, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationHistoryPanelProps {
  organizationId?: string;
}

export const NotificationHistoryPanel: React.FC<NotificationHistoryPanelProps> = ({
  organizationId
}) => {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notification-history', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('family_notifications')
        .select(`
          *,
          regional_sos_events (
            client_id,
            emergency_type,
            priority
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
    refetchInterval: 30000,
  });

  const getMessageTypeIcon = (type: string) => {
    return type === 'quick_action' ? (
      <MessageSquare className="h-4 w-4 text-blue-500" />
    ) : (
      <User className="h-4 w-4 text-green-500" />
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No recent notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex-shrink-0 mt-1">
            {getMessageTypeIcon(notification.message_type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={notification.message_type === 'quick_action' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {notification.message_type === 'quick_action' ? 'Quick Action' : 'Custom Note'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {notification.language?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(notification.sent_at)}
              </div>
            </div>
            
            <p className="text-sm leading-tight mb-2">
              {notification.message}
            </p>
            
            {notification.regional_sos_events && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    C
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {notification.regional_sos_events.emergency_type || 'General'} Emergency
                </span>
                {notification.delivered && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};