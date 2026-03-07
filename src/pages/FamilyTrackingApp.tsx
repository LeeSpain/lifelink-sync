import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Phone, 
  Battery,
  Car,
  Navigation,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  UserPlus
} from 'lucide-react';
import { useUnifiedMap } from '@/hooks/useUnifiedMap';
import { useCircleRealtime } from '@/hooks/useCircleRealtime';
import { useBackgroundLocation } from '@/hooks/useBackgroundLocation';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeFamily } from '@/hooks/useRealTimeFamily';
import { RealTimeStatusBar } from '@/components/family-dashboard/RealTimeStatusBar';
import { EmergencyActionPanel } from '@/components/family-dashboard/EmergencyActionPanel';
import { supabase } from '@/integrations/supabase/client';
import { getFamilyGroupId } from '@/utils/familyGroupUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FamilyInviteQuickSetup from '@/components/family-dashboard/FamilyInviteQuickSetup';
import { MemberPin } from '@/components/map/MemberPin';

type FamilyMember = {
  user_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
  speed?: number;
  activity?: 'driving' | 'walking' | 'stationary';
};

const FamilyTrackingApp = () => {
  const { user } = useOptimizedAuth();
  const { data: familyRole } = useFamilyRole();
  const { toast } = useToast();
  
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { MapView } = useUnifiedMap();
  const { presences, circles, loadInitial } = useCircleRealtime(activeCircleId);
  const { permission, isTracking, requestPermission } = useBackgroundLocation(isLocationEnabled);
  
  // Real-time family communication
  const {
    presences: livePresences,
    alerts,
    notifications,
    isConnected,
    lastUpdate,
    sendCheckIn,
    triggerEmergency,
    onlineMembers,
    totalMembers,
    activeAlerts,
    unreadNotifications
  } = useRealTimeFamily(activeCircleId);

  useEffect(() => {
    loadInitial();
    loadFamilyMembers();
  }, [loadInitial]);

  useEffect(() => {
    if (circles.length > 0 && !activeCircleId) {
      setActiveCircleId(circles[0].id);
    }
  }, [circles, activeCircleId]);

  const loadFamilyMembers = async () => {
    if (!user) return;

    try {
      // Get the user's family group ID using the utility function
      const groupId = await getFamilyGroupId(user.id);

      if (!groupId) {
        console.log('No family group found, creating demo data...');
        await createDemoFamilyData();
        return;
      }

      // Load all family members in the group
      const { data: memberships } = await supabase
        .from('family_memberships')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('status', 'active');

      // Add the owner to the list if they're not already included
      const allUserIds = new Set(memberships?.map(m => m.user_id) || []);
      allUserIds.add(user.id); // Always include current user

      if (allUserIds.size > 0) {
        // Load profiles and presence data
        const memberProfiles = await Promise.all(
          Array.from(allUserIds).map(async (userId) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', userId)
              .single();
            
            const { data: presence } = await supabase
              .from('live_presence')
              .select('*')
              .eq('user_id', userId)
              .single();

            // Generate realistic demo location if no presence data
            const demoLat = 37.7749 + (Math.random() - 0.5) * 0.1;
            const demoLng = -122.4194 + (Math.random() - 0.5) * 0.1;
            
            return {
              user_id: userId,
              name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Family Member',
              first_name: profile?.first_name,
              last_name: profile?.last_name,
              avatar_url: undefined,
              lat: presence?.lat || demoLat,
              lng: presence?.lng || demoLng,
              last_seen: presence?.last_seen || new Date().toISOString(),
              battery: presence?.battery || Math.floor(Math.random() * 100),
              is_paused: presence?.is_paused || false,
              speed: Math.floor(Math.random() * 60),
              activity: (presence?.last_seen 
                ? (Math.random() > 0.5 ? 'driving' : 'walking') 
                : 'stationary') as 'driving' | 'walking' | 'stationary'
            };
          })
        );
        setFamilyMembers(memberProfiles);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const createDemoFamilyData = async () => {
    if (!user) return;
    
    try {
      // Create a family group for the user
      const { data: newGroup, error: groupError } = await supabase
        .from('family_groups')
        .insert({
          owner_user_id: user.id,
          owner_seat_quota: 5
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add current user to live_presence with demo location
      const demoLat = 37.7749;
      const demoLng = -122.4194;
      
      await supabase
        .from('live_presence')
        .upsert({
          user_id: user.id,
          lat: demoLat,
          lng: demoLng,
          last_seen: new Date().toISOString(),
          battery: 85,
          is_paused: false
        });

      // Create demo family member profile
      setFamilyMembers([{
        user_id: user.id,
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'You',
        avatar_url: undefined,
        lat: demoLat,
        lng: demoLng,
        last_seen: new Date().toISOString(),
        battery: 85,
        is_paused: false,
        speed: 0,
        activity: 'stationary'
      }]);

      console.log('Demo family group created successfully');
    } catch (error) {
      console.error('Error creating demo family data:', error);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, [presences, familyRole?.familyGroupId]);

  const getStatusInfo = (member: FamilyMember) => {
    if (!member.last_seen) return { status: 'offline', color: 'bg-gray-400', text: 'Offline' };
    
    const lastSeen = new Date(member.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (member.is_paused) return { status: 'paused', color: 'bg-yellow-400', text: 'Paused' };
    if (diffMinutes < 5) return { status: 'live', color: 'bg-green-400', text: 'Live' };
    if (diffMinutes < 60) return { status: 'recent', color: 'bg-blue-400', text: `${Math.floor(diffMinutes)}m ago` };
    return { status: 'idle', color: 'bg-gray-400', text: 'Idle' };
  };

  const getActivityIcon = (activity?: string) => {
    switch (activity) {
      case 'driving': return <Car className="w-3 h-3" />;
      case 'walking': return <Navigation className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleMemberSelect = (member: FamilyMember) => {
    setSelectedMember(member);
    setShowMap(false);
  };

  const handleCheckIn = async () => {
    try {
      // Record check-in activity
      await supabase.from('user_activity').insert({
        user_id: user?.id,
        activity_type: 'family_check_in',
        description: 'Family check-in from tracking app'
      });

      toast({
        title: "✅ Checked In",
        description: "Your family has been notified you're safe"
      });
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleEmergencySOS = async () => {
    try {
      const { useEmergencySOS } = await import('@/hooks/useEmergencySOS');
      const { triggerEmergencySOS } = useEmergencySOS();
      await triggerEmergencySOS();
      
      toast({
        title: "🚨 Emergency Alert Sent",
        description: "Your family has been notified",
        variant: "destructive"
      });
    } catch (error) {
      console.error('SOS error:', error);
    }
  };

  if (!showMap && selectedMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowMap(true)}
              className="text-blue-600"
            >
              ← Back to Map
            </Button>
            <h1 className="text-lg font-semibold">Family Tracker</h1>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>

          {/* Member Profile */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedMember.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusInfo(selectedMember).color} rounded-full border-2 border-white flex items-center justify-center`}>
                  {getStatusInfo(selectedMember).status === 'live' && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">{selectedMember.name}</h2>
                <Badge variant="outline" className="mt-1">
                  {getStatusInfo(selectedMember).text}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Live Status */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Live Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Location</span>
                </div>
                <span className="text-sm font-mono">
                  {selectedMember.lat.toFixed(4)}, {selectedMember.lng.toFixed(4)}
                </span>
              </div>
              
              {selectedMember.battery && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Battery</span>
                  </div>
                  <span className="text-sm">{selectedMember.battery}%</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getActivityIcon(selectedMember.activity)}
                  <span className="text-sm">Activity</span>
                </div>
                <span className="text-sm capitalize">{selectedMember.activity}</span>
              </div>
              
              {selectedMember.speed && selectedMember.activity === 'driving' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <span className="text-sm">{selectedMember.speed} km/h</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => window.open(`tel:${selectedMember.user_id}`, '_self')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedMember.lat},${selectedMember.lng}`;
                window.open(url, '_blank');
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header with Real-time Status */}
      <div className="bg-white shadow-sm p-4 space-y-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {user?.user_metadata?.first_name ? `${user.user_metadata.first_name}'s Family` : 'My Family'}
            </h1>
            <p className="text-sm text-gray-600">
              {totalMembers || familyMembers.length} {(totalMembers || familyMembers.length) === 1 ? 'member' : 'members'} • {onlineMembers} online
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isTracking ? "default" : "secondary"} className="gap-1">
              <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              {isTracking ? 'Live' : 'Paused'}
            </Badge>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        {/* Real-time Status Bar */}
        <div className="max-w-md mx-auto">
          <RealTimeStatusBar
            isConnected={isConnected}
            onlineMembers={onlineMembers}
            totalMembers={totalMembers || familyMembers.length}
            activeAlerts={activeAlerts}
            unreadNotifications={unreadNotifications}
            lastUpdate={lastUpdate}
            compact={true}
          />
        </div>
      </div>

      {/* Map View - Fixed container height */}
      <div className="min-h-[calc(100vh-200px)] max-h-96">
        <MapView
          className="h-full w-full"
          markers={familyMembers.map(member => ({
            id: member.user_id,
            lat: member.lat,
            lng: member.lng,
            render: () => (
              <MemberPin 
                presence={{
                  user_id: member.user_id,
                  lat: member.lat,
                  lng: member.lng,
                  last_seen: member.last_seen,
                  battery: member.battery,
                  is_paused: member.is_paused,
                  first_name: member.first_name,
                  last_name: member.last_name,
                  avatar_url: member.avatar_url
                }}
                onClick={() => handleMemberSelect(member)}
              />
            )
          }))}
        />
        
        {/* Map Overlay Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="shadow-lg"
            onClick={() => setIsLocationEnabled(!isLocationEnabled)}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Emergency Actions Panel */}
        <EmergencyActionPanel
          onEmergencyTrigger={triggerEmergency}
          onCheckIn={sendCheckIn}
          isConnected={isConnected}
        />
        
        {/* Family Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Family Members</h2>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowInviteModal(true)}
            >
              <Users className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {familyMembers.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-2">No family members yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invite family members to start tracking their location and staying connected.
              </p>
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Family Member
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {familyMembers.map((member, index) => {
                const statusInfo = getStatusInfo(member);
                return (
                  <Card 
                    key={member.user_id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleMemberSelect(member)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusInfo.color} rounded-full border-2 border-white`}>
                              {statusInfo.status === 'live' && (
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse mx-auto mt-0.5" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{member.name}</h3>
                              {member.user_id === user?.id && (
                                <Badge variant="secondary" className="text-xs">You</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {statusInfo.text}
                              </Badge>
                              <span>•</span>
                              {getActivityIcon(member.activity)}
                              <span className="capitalize">{member.activity}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {member.battery && (
                            <div className="flex items-center gap-1 text-sm">
                              <Battery className="w-3 h-3" />
                              <span>{member.battery}%</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {member.last_seen ? new Date(member.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-4" />
      </div>

      {/* Family Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
          </DialogHeader>
          <FamilyInviteQuickSetup onMemberAdded={() => setShowInviteModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyTrackingApp;