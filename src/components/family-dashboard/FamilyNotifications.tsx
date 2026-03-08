import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  Heart,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const FamilyNotifications = () => {
  const { t } = useTranslation();
  const { user } = useOptimizedAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'emergency'>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Set up real-time notifications
      const channel = supabase
        .channel('family-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'family_alerts',
            filter: `family_user_id=eq.${user.id}`
          },
          () => {
            loadNotifications();
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification('Family Emergency Alert', {
                body: 'New family emergency notification received',
                icon: '/favicon.ico'
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data: alerts, error } = await supabase
        .from('family_alerts')
        .select('*')
        .eq('family_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(alerts || []);

    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: t('familyDashboard.error'),
        description: t('familyDashboard.failedLoadEmergency'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('family_alerts')
        .update({ status: 'read' })
        .eq('id', alertId);

      if (error) throw error;
      loadNotifications();

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: t('familyDashboard.notificationsEnabled'),
          description: t('familyDashboard.notificationsEnabledDesc')
        });
      }
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'sos_emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'family_check_in':
        return <Heart className="h-5 w-5 text-green-500" />;
      case 'location_update':
        return <MapPin className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertPriority = (alertType: string) => {
    switch (alertType) {
      case 'sos_emergency':
        return 'HIGH';
      case 'family_check_in':
        return 'NORMAL';
      case 'location_update':
        return 'LOW';
      default:
        return 'NORMAL';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return notification.status !== 'read';
    if (filter === 'emergency') return notification.alert_type === 'sos_emergency';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('familyDashboard.familyNotifications')}</h1>
          <p className="text-muted-foreground">
            {t('familyDashboard.emergencyAlertsAndUpdates')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="destructive">{t('familyDashboard.unreadCount', { count: unreadCount })}</Badge>
          )}
          {Notification.permission === 'default' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={requestNotificationPermission}
            >
              <Bell className="h-4 w-4 mr-2" />
              {t('familyDashboard.enableNotifications')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t('familyDashboard.allFilter', { count: notifications.length })}
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              {t('familyDashboard.unreadFilter', { count: unreadCount })}
            </Button>
            <Button
              variant={filter === 'emergency' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('emergency')}
            >
              {t('familyDashboard.emergencyFilter', { count: notifications.filter(n => n.alert_type === 'sos_emergency').length })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`${
                notification.status !== 'read' ? 'border-l-4 border-l-primary bg-primary/5' : ''
              } ${
                notification.alert_type === 'sos_emergency' ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(notification.alert_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {notification.alert_type.replace('_', ' ').toUpperCase()}
                        </h3>
                        <Badge 
                          variant={getAlertPriority(notification.alert_type) === 'HIGH' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {getAlertPriority(notification.alert_type)}
                        </Badge>
                        {notification.status !== 'read' && (
                          <Badge variant="outline" className="text-xs">{t('familyDashboard.new')}</Badge>
                        )}
                      </div>
                      
                      {notification.alert_data?.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{notification.alert_data.location.address || t('familyDashboard.locationAvailable')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                        {notification.delivered_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>{t('familyDashboard.delivered')} {new Date(notification.delivered_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notification.alert_type === 'sos_emergency' && notification.alert_data?.location && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const { latitude, longitude } = notification.alert_data.location;
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {t('familyDashboard.directions')}
                      </Button>
                    )}
                    
                    {notification.status !== 'read' && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                      >
                        {t('familyDashboard.markRead')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'all' ? t('familyDashboard.noNotifications') : t('familyDashboard.noFilteredNotifications', { filter })}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all'
                  ? t('familyDashboard.allCaughtUp')
                  : t('familyDashboard.noFilteredFound', { filter })
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notification Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('familyDashboard.notificationSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>{t('familyDashboard.browserNotifications')}</span>
            <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
              {Notification.permission === 'granted' ? t('familyDashboard.enabled') : t('familyDashboard.disabled')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('familyDashboard.emergencyAlertsLabel')}</span>
            <Badge variant="default">{t('familyDashboard.alwaysOn')}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('familyDashboard.familyUpdates')}</span>
            <Badge variant="default">{t('familyDashboard.enabled')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {t('familyDashboard.notificationsAlwaysEnabled')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyNotifications;