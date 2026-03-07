import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Circle, 
  Clock,
  Eye,
  EyeOff,
  Battery,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '@/hooks/useConnections';

export const LiveFamilyStatus = () => {
  const navigate = useNavigate();
  const { data: familyConnections = [] } = useConnections('family_circle');
  
  const activeFamily = familyConnections.filter(c => c.status === 'active').slice(0, 4);

  // Mock presence data - in real app this would come from live_presence table
  const getMockStatus = (index: number) => {
    const statuses = ['online', 'recent', 'offline', 'paused'];
    const lastSeen = [2, 15, 120, 45];
    const battery = [85, 45, null, 67];
    
    return {
      status: statuses[index % statuses.length],
      lastSeen: lastSeen[index % lastSeen.length],
      battery: battery[index % battery.length],
      location: index < 2 ? 'Home' : null
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'recent': return 'text-yellow-500';
      case 'paused': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Circle className="h-2 w-2 fill-current" />;
      case 'recent': return <Circle className="h-2 w-2 fill-current" />;
      case 'paused': return <EyeOff className="h-3 w-3" />;
      default: return <Circle className="h-2 w-2" />;
    }
  };

  const formatLastSeen = (minutes: number) => {
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-600" />
            Live Family Status
          </CardTitle>
          <Button 
            onClick={() => navigate('/member-dashboard/live-map')}
            variant="outline" 
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-2" />
            View Map
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeFamily.length > 0 ? (
          <>
            {/* Family Members Status */}
            <div className="space-y-3">
              {activeFamily.map((connection, index) => {
                const mockStatus = getMockStatus(index);
                return (
                  <div key={connection.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${connection.invite_email}`} />
                        <AvatarFallback className="text-xs">
                          {connection.invite_email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 ${getStatusColor(mockStatus.status)}`}>
                        {getStatusIcon(mockStatus.status)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {connection.relationship || 'Family Member'}
                        </p>
                        <Badge 
                          variant={mockStatus.status === 'online' ? 'default' : 'secondary'} 
                          className="text-xs px-1.5 py-0.5 h-auto"
                        >
                          {mockStatus.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {mockStatus.status === 'online' ? 'Now' : formatLastSeen(mockStatus.lastSeen)}
                        </div>
                        {mockStatus.battery && (
                          <div className="flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            {mockStatus.battery}%
                          </div>
                        )}
                        {mockStatus.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {mockStatus.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {activeFamily.filter((_, i) => getMockStatus(i).status === 'online').length}
                </div>
                <div className="text-xs text-muted-foreground">Live Now</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {activeFamily.filter((_, i) => getMockStatus(i).status !== 'offline').length}
                </div>
                <div className="text-xs text-muted-foreground">Active Today</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-500">
                  {activeFamily.filter((_, i) => getMockStatus(i).status === 'offline').length}
                </div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
            </div>

            {/* Quick Action */}
            <Button 
              onClick={() => navigate('/member-dashboard/live-map')} 
              className="w-full" 
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Live Locations
            </Button>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-6">
            <Navigation className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-semibold text-sm mb-1">No family members yet</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Add family members to see their live status
            </p>
            <Button 
              onClick={() => navigate('/member-dashboard/connections')} 
              size="sm"
            >
              Add Family Members
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};