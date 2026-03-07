import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  AlertTriangle, 
  Bell, 
  CheckCircle,
  Battery,
  Signal,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeStatusBarProps {
  isConnected: boolean;
  onlineMembers: number;
  totalMembers: number;
  activeAlerts: number;
  unreadNotifications: number;
  lastUpdate: Date;
  onNotificationsClick?: () => void;
  onAlertsClick?: () => void;
  compact?: boolean;
}

export function RealTimeStatusBar({
  isConnected,
  onlineMembers,
  totalMembers,
  activeAlerts,
  unreadNotifications,
  lastUpdate,
  onNotificationsClick,
  onAlertsClick,
  compact = false
}: RealTimeStatusBarProps) {
  const getTimeSinceLastUpdate = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-background/95 backdrop-blur-sm border rounded-lg">
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span className={cn(
            "text-xs font-medium",
            isConnected ? "text-green-600" : "text-red-600"
          )}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        
        {/* Active Members */}
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {onlineMembers}/{totalMembers}
        </Badge>
        
        {/* Emergency Alerts */}
        {activeAlerts > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAlertsClick}
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {activeAlerts}
          </Button>
        )}
        
        {/* Notifications */}
        {unreadNotifications > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotificationsClick}
            className="h-6 px-2 text-xs relative"
          >
            <Bell className="h-3 w-3" />
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </div>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Real-Time Status</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {getTimeSinceLastUpdate()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            isConnected ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            {isConnected ? (
              <Signal className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium">Connection</p>
            <p className={cn(
              "text-xs",
              isConnected ? "text-green-600" : "text-red-600"
            )}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
        
        {/* Active Members */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium">Active</p>
            <p className="text-xs text-blue-600">
              {onlineMembers} of {totalMembers}
            </p>
          </div>
        </div>
        
        {/* Emergency Alerts */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAlertsClick}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg justify-start h-auto",
            activeAlerts > 0 ? "bg-red-50 hover:bg-red-100" : "bg-muted/50"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            activeAlerts > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
          )}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium">Alerts</p>
            <p className={cn(
              "text-xs",
              activeAlerts > 0 ? "text-red-600" : "text-gray-600"
            )}>
              {activeAlerts} active
            </p>
          </div>
        </Button>
        
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNotificationsClick}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg justify-start h-auto relative",
            unreadNotifications > 0 ? "bg-blue-50 hover:bg-blue-100" : "bg-muted/50"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            unreadNotifications > 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
          )}>
            <Bell className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium">Messages</p>
            <p className={cn(
              "text-xs",
              unreadNotifications > 0 ? "text-blue-600" : "text-gray-600"
            )}>
              {unreadNotifications} unread
            </p>
          </div>
          {unreadNotifications > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </div>
          )}
        </Button>
      </div>
      
      {/* System Health Indicators */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Location Services</span>
          </div>
          <div className="flex items-center gap-1">
            <Battery className="h-3 w-3 text-green-500" />
            <span>Background Sync</span>
          </div>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {isConnected ? 'Real-time Active' : 'Offline Mode'}
        </Badge>
      </div>
    </Card>
  );
}