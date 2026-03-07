import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Signal, 
  Battery, 
  MapPin, 
  Clock, 
  Wifi, 
  WifiOff, 
  Eye,
  MessageCircle,
  Phone,
  Video,
  AlertTriangle,
  CheckCircle,
  Circle,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionHealth {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  latency: number | null;
}

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
  };
  status: 'online' | 'away' | 'idle' | 'offline';
  lastSeen: Date;
  battery?: number;
  connectionHealth: ConnectionHealth;
  device?: {
    type: 'mobile' | 'desktop' | 'tablet';
    name?: string;
  };
  presence?: {
    isTyping: boolean;
    isLookingAtMap: boolean;
    activity: string;
  };
  permissions: {
    canViewLocation: boolean;
    canViewHistory: boolean;
    canViewDevices: boolean;
  };
}

interface EnhancedConnectionDisplayProps {
  members: FamilyMember[];
  currentUserId: string;
  onMemberSelect?: (member: FamilyMember) => void;
  onCallMember?: (memberId: string) => void;
  onMessageMember?: (memberId: string) => void;
  onVideoCall?: (memberId: string) => void;
  className?: string;
}

const getStatusColor = (status: FamilyMember['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'idle': return 'bg-orange-500';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getStatusIcon = (status: FamilyMember['status']) => {
  switch (status) {
    case 'online': return CheckCircle;
    case 'away': return Clock;
    case 'idle': return Pause;
    case 'offline': return Circle;
    default: return Circle;
  }
};

const getConnectionQuality = (health: ConnectionHealth) => {
  if (!health.isConnected) return 'offline';
  if (!health.latency) return 'unknown';
  if (health.latency < 100) return 'excellent';
  if (health.latency < 300) return 'good';
  if (health.latency < 1000) return 'fair';
  return 'poor';
};

const getConnectionQualityColor = (quality: string) => {
  switch (quality) {
    case 'excellent': return 'text-green-500';
    case 'good': return 'text-blue-500';
    case 'fair': return 'text-yellow-500';
    case 'poor': return 'text-orange-500';
    case 'offline': return 'text-red-500';
    default: return 'text-gray-400';
  }
};

const MemberConnectionCard: React.FC<{
  member: FamilyMember;
  isCurrentUser: boolean;
  onSelect?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onVideoCall?: () => void;
}> = ({ member, isCurrentUser, onSelect, onCall, onMessage, onVideoCall }) => {
  const StatusIcon = getStatusIcon(member.status);
  const connectionQuality = getConnectionQuality(member.connectionHealth);
  
  return (
    <Card 
      className={cn(
        "relative transition-all duration-300 hover:shadow-lg cursor-pointer",
        "border-l-4",
        member.status === 'online' ? "border-l-green-500" : 
        member.status === 'away' ? "border-l-yellow-500" :
        member.status === 'idle' ? "border-l-orange-500" : "border-l-gray-400",
        isCurrentUser && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              {/* Status Indicator */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                getStatusColor(member.status)
              )} />
              
              {/* Typing Indicator */}
              {member.presence?.isTyping && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm truncate">{member.name}</h3>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-1 mt-1">
                <StatusIcon className="h-3 w-3" />
                <span className="text-xs text-muted-foreground capitalize">
                  {member.status}
                </span>
                {member.presence?.activity && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {member.presence.activity}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Connection Quality */}
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1">
              {member.connectionHealth.isConnected ? (
                <Wifi className={cn("h-3 w-3", getConnectionQualityColor(connectionQuality))} />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span className={cn("text-xs", getConnectionQualityColor(connectionQuality))}>
                {member.connectionHealth.latency ? `${member.connectionHealth.latency}ms` : connectionQuality}
              </span>
            </div>
            
            {member.connectionHealth.reconnectAttempts > 0 && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-yellow-600">
                  {member.connectionHealth.reconnectAttempts} retries
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Device and Battery Info */}
        {(member.device || member.battery !== undefined) && (
          <div className="flex items-center justify-between mb-3 p-2 bg-background/50 rounded-lg">
            {member.device && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {member.device.name || member.device.type}
                </span>
              </div>
            )}
            
            {member.battery !== undefined && (
              <div className="flex items-center space-x-2">
                <Battery className={cn(
                  "h-3 w-3",
                  member.battery > 20 ? "text-green-500" : "text-red-500"
                )} />
                <span className="text-xs text-muted-foreground">
                  {member.battery}%
                </span>
                {member.battery <= 20 && (
                  <Progress value={member.battery} className="w-8 h-1" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Location Info */}
        {member.location && member.permissions.canViewLocation && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-background/50 rounded-lg">
            <MapPin className="h-3 w-3 text-blue-500" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">
                {member.location.address || `${member.location.lat.toFixed(4)}, ${member.location.lng.toFixed(4)}`}
              </span>
              {member.location.accuracy && (
                <span className="text-xs text-muted-foreground ml-2">
                  ±{member.location.accuracy}m
                </span>
              )}
            </div>
          </div>
        )}

        {/* Presence Activities */}
        {member.presence && (
          <div className="flex items-center space-x-4 mb-3">
            {member.presence.isLookingAtMap && (
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">Viewing map</span>
              </div>
            )}
            
            {member.presence.isTyping && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3 text-green-500 animate-pulse" />
                <span className="text-xs text-green-600">Typing...</span>
              </div>
            )}
          </div>
        )}

        {/* Last Seen */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {member.status === 'online' ? 'Online now' : `Last seen ${formatDistanceToNow(member.lastSeen)} ago`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCurrentUser && member.status === 'online' && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMessage?.();
              }}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              <span>Message</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCall?.();
              }}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span>Call</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVideoCall?.();
              }}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              <Video className="h-3 w-3" />
              <span>Video</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const EnhancedConnectionDisplay: React.FC<EnhancedConnectionDisplayProps> = ({
  members,
  currentUserId,
  onMemberSelect,
  onCallMember,
  onMessageMember,
  onVideoCall,
  className
}) => {
  const onlineMembers = members.filter(m => m.status === 'online');
  const offlineMembers = members.filter(m => m.status !== 'online');
  
  const connectionStats = {
    total: members.length,
    online: onlineMembers.length,
    away: members.filter(m => m.status === 'away').length,
    idle: members.filter(m => m.status === 'idle').length,
    offline: members.filter(m => m.status === 'offline').length,
    averageLatency: onlineMembers.reduce((acc, m) => acc + (m.connectionHealth.latency || 0), 0) / onlineMembers.length || 0
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Connection Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Family Connections</span>
            <Badge variant="outline">
              {connectionStats.online}/{connectionStats.total} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Online: {connectionStats.online}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Away: {connectionStats.away}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Idle: {connectionStats.idle}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Offline: {connectionStats.offline}
              </span>
            </div>
          </div>
          
          {connectionStats.averageLatency > 0 && (
            <div className="mt-4 p-3 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network Quality</span>
                <span className={cn(
                  "text-sm font-medium",
                  connectionStats.averageLatency < 100 ? "text-green-600" :
                  connectionStats.averageLatency < 300 ? "text-blue-600" :
                  connectionStats.averageLatency < 1000 ? "text-yellow-600" : "text-red-600"
                )}>
                  {connectionStats.averageLatency.toFixed(0)}ms avg
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Online Now ({onlineMembers.length})</span>
          </h3>
          <div className="grid gap-3">
            {onlineMembers.map((member) => (
              <MemberConnectionCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
                onSelect={() => onMemberSelect?.(member)}
                onCall={() => onCallMember?.(member.id)}
                onMessage={() => onMessageMember?.(member.id)}
                onVideoCall={() => onVideoCall?.(member.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offline/Away Members */}
      {offlineMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span>Recently Active ({offlineMembers.length})</span>
          </h3>
          <div className="grid gap-3 opacity-75">
            {offlineMembers.map((member) => (
              <MemberConnectionCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
                onSelect={() => onMemberSelect?.(member)}
                onCall={() => onCallMember?.(member.id)}
                onMessage={() => onMessageMember?.(member.id)}
                onVideoCall={() => onVideoCall?.(member.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};