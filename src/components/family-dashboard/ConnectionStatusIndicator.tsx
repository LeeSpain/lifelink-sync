import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Signal, 
  Battery, 
  MapPin, 
  Clock, 
  Wifi, 
  WifiOff, 
  Eye,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Circle,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionStatusIndicatorProps {
  status: 'online' | 'away' | 'idle' | 'offline';
  isConnected: boolean;
  latency?: number;
  battery?: number;
  lastSeen: Date;
  isTyping?: boolean;
  isViewingMap?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const getStatusColor = (status: ConnectionStatusIndicatorProps['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500 border-green-600';
    case 'away': return 'bg-yellow-500 border-yellow-600';
    case 'idle': return 'bg-orange-500 border-orange-600';
    case 'offline': return 'bg-gray-400 border-gray-500';
    default: return 'bg-gray-400 border-gray-500';
  }
};

const getStatusIcon = (status: ConnectionStatusIndicatorProps['status']) => {
  switch (status) {
    case 'online': return CheckCircle;
    case 'away': return Clock;
    case 'idle': return Pause;
    case 'offline': return Circle;
    default: return Circle;
  }
};

const getConnectionQualityColor = (latency?: number) => {
  if (!latency) return 'text-gray-400';
  if (latency < 100) return 'text-green-500';
  if (latency < 300) return 'text-blue-500';
  if (latency < 1000) return 'text-yellow-500';
  return 'text-red-500';
};

const getBatteryColor = (battery?: number) => {
  if (!battery) return 'text-gray-400';
  if (battery > 50) return 'text-green-500';
  if (battery > 20) return 'text-yellow-500';
  return 'text-red-500';
};

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  isConnected,
  latency,
  battery,
  lastSeen,
  isTyping = false,
  isViewingMap = false,
  size = 'md',
  showDetails = false,
  className
}) => {
  const StatusIcon = getStatusIcon(status);
  
  const sizeClasses = {
    sm: {
      indicator: 'w-2 h-2',
      icon: 'h-3 w-3',
      text: 'text-xs',
      badge: 'text-xs px-1 py-0.5'
    },
    md: {
      indicator: 'w-3 h-3',
      icon: 'h-4 w-4',
      text: 'text-sm',
      badge: 'text-xs px-2 py-1'
    },
    lg: {
      indicator: 'w-4 h-4',
      icon: 'h-5 w-5',
      text: 'text-base',
      badge: 'text-sm px-3 py-1'
    }
  };

  const sizeClass = sizeClasses[size];

  if (!showDetails) {
    return (
      <div className={cn("relative", className)}>
        <div className={cn(
          "rounded-full border-2",
          getStatusColor(status),
          sizeClass.indicator,
          status === 'online' && "animate-pulse"
        )} />
        
        {/* Activity indicators */}
        {isTyping && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
        {isViewingMap && (
          <Eye className="absolute -top-1 -right-1 h-2 w-2 text-blue-500" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Main Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <div className={cn(
            "rounded-full border-2",
            getStatusColor(status),
            sizeClass.indicator,
            status === 'online' && "animate-pulse"
          )} />
          
          {isTyping && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
        
        <StatusIcon className={cn(sizeClass.icon, "text-muted-foreground")} />
        
        <span className={cn(sizeClass.text, "capitalize text-muted-foreground")}>
          {status}
        </span>
      </div>

      {/* Connection Quality */}
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <Wifi className={cn(sizeClass.icon, getConnectionQualityColor(latency))} />
        ) : (
          <WifiOff className={cn(sizeClass.icon, "text-red-500")} />
        )}
        
        {latency && (
          <span className={cn(sizeClass.text, getConnectionQualityColor(latency))}>
            {latency}ms
          </span>
        )}
      </div>

      {/* Battery Level */}
      {battery !== undefined && (
        <div className="flex items-center space-x-1">
          <Battery className={cn(sizeClass.icon, getBatteryColor(battery))} />
          <span className={cn(sizeClass.text, getBatteryColor(battery))}>
            {battery}%
          </span>
        </div>
      )}

      {/* Activity Indicators */}
      <div className="flex items-center space-x-1">
        {isTyping && (
          <Badge variant="secondary" className={cn(sizeClass.badge, "bg-blue-100 text-blue-700")}>
            <MessageCircle className="h-3 w-3 mr-1 animate-pulse" />
            Typing
          </Badge>
        )}
        
        {isViewingMap && (
          <Badge variant="secondary" className={cn(sizeClass.badge, "bg-green-100 text-green-700")}>
            <Eye className="h-3 w-3 mr-1" />
            Map
          </Badge>
        )}
      </div>

      {/* Last Seen */}
      <div className="flex items-center space-x-1">
        <Clock className={cn(sizeClass.icon, "text-muted-foreground")} />
        <span className={cn(sizeClass.text, "text-muted-foreground")}>
          {status === 'online' ? 'now' : formatDistanceToNow(lastSeen, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

interface FamilyMemberWithStatusProps {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'idle' | 'offline';
  isConnected: boolean;
  latency?: number;
  battery?: number;
  lastSeen: Date;
  isTyping?: boolean;
  isViewingMap?: boolean;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  onClick?: () => void;
  className?: string;
}

export const FamilyMemberWithStatus: React.FC<FamilyMemberWithStatusProps> = ({
  id,
  name,
  avatar,
  status,
  isConnected,
  latency,
  battery,
  lastSeen,
  isTyping = false,
  isViewingMap = false,
  location,
  onClick,
  className
}) => {
  return (
    <div 
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-background/50",
        className
      )}
      onClick={onClick}
    >
      {/* Avatar with Status Overlay */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="absolute -bottom-1 -right-1">
          <ConnectionStatusIndicator
            status={status}
            isConnected={isConnected}
            latency={latency}
            battery={battery}
            lastSeen={lastSeen}
            isTyping={isTyping}
            isViewingMap={isViewingMap}
            size="sm"
          />
        </div>
      </div>

      {/* Member Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-sm truncate">{name}</h4>
          
          {/* Activity Badges */}
          {isTyping && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              <MessageCircle className="h-3 w-3 mr-1 animate-pulse" />
              Typing
            </Badge>
          )}
          
          {isViewingMap && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              <Eye className="h-3 w-3 mr-1" />
              Map
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <ConnectionStatusIndicator
            status={status}
            isConnected={isConnected}
            latency={latency}
            battery={battery}
            lastSeen={lastSeen}
            size="sm"
            showDetails={false}
          />
          
          <span className="text-xs text-muted-foreground capitalize">
            {status === 'online' ? 'Online now' : `${status} • ${formatDistanceToNow(lastSeen)} ago`}
          </span>
          
          {location && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">
                  {location.accuracy ? `±${location.accuracy}m` : 'Located'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signal Strength */}
      <div className="flex flex-col items-end space-y-1">
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className={cn("h-4 w-4", getConnectionQualityColor(latency))} />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          
          {latency && (
            <span className={cn("text-xs", getConnectionQualityColor(latency))}>
              {latency}ms
            </span>
          )}
        </div>
        
        {battery !== undefined && (
          <div className="flex items-center space-x-1">
            <Battery className={cn("h-3 w-3", getBatteryColor(battery))} />
            <span className={cn("text-xs", getBatteryColor(battery))}>
              {battery}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};