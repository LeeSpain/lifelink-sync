import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Signal, 
  Activity, 
  MapPin, 
  Settings,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedConnectionDisplay } from './EnhancedConnectionDisplay';
import { useEnhancedConnectionDisplay } from '@/hooks/useEnhancedConnectionDisplay';
import { useFamilyRole } from '@/hooks/useFamilyRole';

const ConnectionDashboard: React.FC = () => {
  const { data: familyRole } = useFamilyRole();
  const {
    familyMembers,
    connectionMetrics,
    onlineMembers,
    offlineMembers,
    currentUser,
    callMember,
    messageMember,
    videoCallMember,
    loadFamilyMembers,
    trackPresenceActivity,
    updateMemberPermissions,
    isConnected,
    hasErrors,
    circleRealtime,
    liveLocation
  } = useEnhancedConnectionDisplay(familyRole?.familyGroupId);

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFamilyMembers();
    await circleRealtime.refresh();
    await liveLocation.refetch();
    setIsRefreshing(false);
  };

  const getConnectionStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    if (hasErrors) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConnectionStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (hasErrors) return 'Unstable';
    return 'Connected';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family Connections</h1>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className={getConnectionStatusColor()} />
              ) : (
                <WifiOff className={getConnectionStatusColor()} />
              )}
              <span className={cn("text-sm", getConnectionStatusColor())}>
                {getConnectionStatusText()}
              </span>
            </div>
            
            {connectionMetrics.averageLatency > 0 && (
              <div className="flex items-center space-x-2">
                <Signal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {connectionMetrics.averageLatency.toFixed(0)}ms
                </span>
              </div>
            )}
            
            {connectionMetrics.lastUpdate && (
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Updated {connectionMetrics.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{connectionMetrics.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold text-green-600">{connectionMetrics.onlineMembers}</p>
              </div>
              <div className="relative">
                <CheckCircle className="h-8 w-8 text-green-500" />
                {connectionMetrics.onlineMembers > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connection Quality</p>
                <p className={cn(
                  "text-2xl font-bold",
                  connectionMetrics.connectionQuality === 'excellent' ? 'text-green-600' :
                  connectionMetrics.connectionQuality === 'good' ? 'text-blue-600' :
                  connectionMetrics.connectionQuality === 'fair' ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {connectionMetrics.connectionQuality}
                </p>
              </div>
              <Signal className={cn(
                "h-8 w-8",
                connectionMetrics.connectionQuality === 'excellent' ? 'text-green-500' :
                connectionMetrics.connectionQuality === 'good' ? 'text-blue-500' :
                connectionMetrics.connectionQuality === 'fair' ? 'text-yellow-500' : 'text-red-500'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {connectionMetrics.averageLatency > 0 ? `${connectionMetrics.averageLatency.toFixed(0)}ms` : '--'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Banner for Connection Issues */}
      {hasErrors && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Connection Issues Detected</p>
                <p className="text-sm text-yellow-700">
                  Some family members may have unstable connections. Real-time updates might be delayed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>All Members ({familyMembers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="online" className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Online ({onlineMembers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Locations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <EnhancedConnectionDisplay
            members={familyMembers}
            currentUserId={currentUser?.id || ''}
            onMemberSelect={setSelectedMember}
            onCallMember={callMember}
            onMessageMember={messageMember}
            onVideoCall={videoCallMember}
          />
        </TabsContent>

        <TabsContent value="online" className="space-y-4">
          {onlineMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No Family Members Online
                </h3>
                <p className="text-sm text-muted-foreground">
                  Family members will appear here when they come online.
                </p>
              </CardContent>
            </Card>
          ) : (
            <EnhancedConnectionDisplay
              members={onlineMembers}
              currentUserId={currentUser?.id || ''}
              onMemberSelect={setSelectedMember}
              onCallMember={callMember}
              onMessageMember={messageMember}
              onVideoCall={videoCallMember}
            />
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location Sharing Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium">{member.name}</div>
                      {member.id === currentUser?.id && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {member.location ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">Sharing Location</span>
                          {member.location.accuracy && (
                            <span className="text-xs text-muted-foreground">
                              ±{member.location.accuracy}m
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <EyeOff className="h-4 w-4" />
                          <span className="text-sm">Not Sharing</span>
                        </div>
                      )}
                      
                      {member.permissions.canViewLocation ? (
                        <Badge variant="outline" className="text-green-600">
                          Can View
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          Restricted
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionDashboard;