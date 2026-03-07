import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Battery, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveLocationMarkerProps {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'idle' | 'offline';
  isEmergency?: boolean;
  batteryLevel?: number;
  accuracy?: number;
  lastSeen?: string;
  speed?: number;
  heading?: number;
  className?: string;
  onClick?: () => void;
}

const LiveLocationMarker: React.FC<LiveLocationMarkerProps> = ({
  id,
  name,
  avatar,
  status,
  isEmergency = false,
  batteryLevel,
  accuracy,
  lastSeen,
  speed,
  heading,
  className,
  onClick
}) => {
  const getStatusColor = () => {
    if (isEmergency) return 'border-red-500 bg-red-500';
    switch (status) {
      case 'online': return 'border-emerald-500 bg-emerald-500';
      case 'idle': return 'border-amber-500 bg-amber-500';
      case 'offline': return 'border-gray-500 bg-gray-500';
      default: return 'border-gray-400 bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (isEmergency) return 'EMERGENCY';
    switch (status) {
      case 'online': return 'Live';
      case 'idle': return 'Idle';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const formatLastSeen = () => {
    if (!lastSeen) return null;
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "relative bg-background/95 backdrop-blur-sm border rounded-xl p-3 min-w-[200px] shadow-lg",
        onClick && "cursor-pointer hover:bg-background/98 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {/* Status indicator */}
      <div className="absolute -top-2 -right-2">
        <div className={cn(
          "w-4 h-4 rounded-full border-2 border-background",
          getStatusColor(),
          isEmergency && "animate-pulse"
        )}></div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm">{name}</h3>
            <Badge 
              variant={isEmergency ? "destructive" : status === 'online' ? "default" : "secondary"}
              className="text-xs h-4 px-1.5"
            >
              {getStatusText()}
            </Badge>
          </div>
          
          {lastSeen && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatLastSeen()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Location details */}
      <div className="space-y-2 text-xs">
        {accuracy && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Accuracy: ±{Math.round(accuracy)}m</span>
          </div>
        )}
        
        {speed !== undefined && speed > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Navigation className="h-3 w-3" />
            <span>Speed: {Math.round(speed * 3.6)} km/h</span>
          </div>
        )}
        
        {batteryLevel && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Battery className="h-3 w-3" />
            <span>Battery: {batteryLevel}%</span>
          </div>
        )}
      </div>

      {/* Emergency alert */}
      {isEmergency && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 text-xs font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Emergency SOS Active
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveLocationMarker;