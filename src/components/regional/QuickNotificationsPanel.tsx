import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QUICK_NOTIFICATIONS } from '@/lib/notifications';
import { MessageSquare, Phone, CheckCircle, User, AlertTriangle, Clock } from 'lucide-react';

interface QuickNotificationsPanelProps {
  selectedClient: any;
  organizationId?: string;
}

export const QuickNotificationsPanel: React.FC<QuickNotificationsPanelProps> = ({
  selectedClient,
  organizationId
}) => {
  const getIconForNotification = (key: string) => {
    const iconMap = {
      emergency_services_contacted: <Phone className="h-4 w-4" />,
      operator_responding: <MessageSquare className="h-4 w-4" />,
      false_alarm_confirmed: <CheckCircle className="h-4 w-4" />,
      medical_assistance_dispatched: <AlertTriangle className="h-4 w-4" />,
      contact_primary_success: <User className="h-4 w-4" />,
      en_route_hospital: <AlertTriangle className="h-4 w-4" />,
      situation_resolved: <CheckCircle className="h-4 w-4" />,
      advice_given: <User className="h-4 w-4" />,
      escalating_to_112: <Phone className="h-4 w-4" />,
      family_member_en_route: <Clock className="h-4 w-4" />
    };
    return iconMap[key as keyof typeof iconMap] || <MessageSquare className="h-4 w-4" />;
  };

  const getVariantForNotification = (key: string) => {
    const urgentNotifications = [
      'emergency_services_contacted',
      'medical_assistance_dispatched', 
      'escalating_to_112'
    ];
    return urgentNotifications.includes(key) ? 'destructive' : 'outline';
  };

  const handleQuickNotification = (notificationKey: string) => {
    // This would trigger the notification - handled by parent component
    console.log('Quick notification:', notificationKey);
  };

  if (!selectedClient) {
    return (
      <div className="text-center py-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Select a client to send quick notifications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        Quick notifications for <strong>{selectedClient.first_name} {selectedClient.last_name}</strong>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {QUICK_NOTIFICATIONS.map((notification) => (
          <Button
            key={notification.key}
            variant={getVariantForNotification(notification.key)}
            size="sm"
            className="w-full justify-start text-left h-auto py-2 px-3"
            onClick={() => handleQuickNotification(notification.key)}
          >
            <div className="flex items-start gap-2 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {getIconForNotification(notification.key)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight mb-1">
                  {notification.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-xs opacity-75 leading-tight">
                  {notification.en}
                </div>
                {notification.placeholders && notification.placeholders.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {notification.placeholders.map(placeholder => (
                      <Badge key={placeholder} variant="secondary" className="text-xs px-1 py-0">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};