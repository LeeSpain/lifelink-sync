import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, MessageSquare, Shield, ChevronDown, ChevronUp, Battery, Clock, CheckCircle2, AlertTriangle, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useUnifiedMap } from '@/hooks/useUnifiedMap';
import FamilyMarker from '@/components/map/FamilyMarker';
import { useEmergencySOS } from '@/hooks/useEmergencySOS';
import { useEmergencyDisclaimer } from '@/hooks/useEmergencyDisclaimer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FamilyLocationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'live' | 'alert' | 'idle';
  lastSeen: string;
  location: string;
  battery: number;
  avatar?: string;
}

const FamilyAppPage = () => {
  const { user } = useAuth();
  const { data: familyRole } = useFamilyRole();
  const { data: familyData, isLoading } = useFamilyMembers(familyRole?.familyGroupId);
  const { MapView } = useUnifiedMap();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const { 
    showDisclaimer, 
    requestDisclaimerAcceptance, 
    acceptDisclaimer, 
    cancelDisclaimer 
  } = useEmergencyDisclaimer();
  
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('location');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const activeFamilyMembers = familyData?.members?.filter(member => member.status === 'active') || [];

  // Load unread notifications count
  React.useEffect(() => {
    if (!user) return;
    
    const loadNotificationsCount = async () => {
      try {
        const { data } = await supabase
          .from('family_alerts')
          .select('id')
          .eq('family_user_id', user.id)
          .neq('status', 'read');
        
        setUnreadNotifications(data?.length || 0);
      } catch (error) {
        console.error('Error loading notifications count:', error);
      }
    };

    loadNotificationsCount();
    
    // Real-time updates for notifications
    const channel = supabase
      .channel('family-notification-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_alerts',
          filter: `family_user_id=eq.${user.id}`
        },
        () => loadNotificationsCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Generate mock location data for family members
  const generateFamilyLocations = (): FamilyLocationData[] => {
    const baseLocation = { lat: 40.7589, lng: -73.9851 };
    const locations = [
      'Home', 'Work', 'School', 'Gym', 'Coffee Shop', 'Park'
    ];
    
    // Use active family members directly
    const filteredMembers = activeFamilyMembers;
    
    return filteredMembers.map((member, index) => ({
      id: member.id,
      name: member.name || member.email.split('@')[0],
      lat: baseLocation.lat + (Math.random() - 0.5) * 0.02,
      lng: baseLocation.lng + (Math.random() - 0.5) * 0.02,
      status: index === 0 ? 'alert' : Math.random() > 0.7 ? 'idle' : 'live',
      lastSeen: Math.random() > 0.6 ? 'Now' : `${Math.floor(Math.random() * 30)}m ago`,
      location: locations[Math.floor(Math.random() * locations.length)],
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name || member.email}`
    }));
  };

  const familyLocations = generateFamilyLocations();

  const mapMarkers = familyLocations.map((location) => ({
    id: location.id,
    lat: location.lat,
    lng: location.lng,
    render: () => (
      <FamilyMarker
        id={location.id}
        name={location.name}
        avatar={location.avatar || ''}
        status={location.status}
      />
    )
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'alert': return 'bg-red-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Live';
      case 'alert': return 'Alert';
      case 'idle': return 'Idle';
      default: return 'Offline';
    }
  };

  const handleTabNavigation = (tabId: string) => {
    setSelectedTab(tabId);
    
    switch (tabId) {
      case 'location':
        // Stay on current page
        break;
      case 'safety':
        navigate('/family-dashboard/emergency-map');
        break;
      case 'membership':
        navigate('/family-dashboard/profile');
        break;
      case 'communication':
        navigate('/family-dashboard/notifications');
        break;
    }
  };

  const handleCheckIn = async () => {
    try {
      // Send check-in notification to family
      await supabase.functions.invoke('family-sos-alerts', {
        body: {
          alert_type: 'family_check_in',
          message: 'Family member has checked in safely',
          user_name: user?.user_metadata?.first_name || 'Family Member'
        }
      });
      
      toast({
        title: "Check-in Sent",
        description: "Family has been notified of your safe check-in",
      });
    } catch (error) {
      console.error('Check-in failed:', error);
      toast({
        title: "Check-in Failed",
        description: "Could not send check-in notification",
        variant: "destructive"
      });
    }
  };

  const handleEmergencySOS = async () => {
    if (!requestDisclaimerAcceptance()) {
      return; // Disclaimer will be shown
    }
    
    try {
      await triggerEmergencySOS();
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <SEO 
        title="Family Tracker - Live Map"
        description="Real-time family member location tracking with live map view"
      />

      {/* Top Header with Family Selector */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Select defaultValue="wakeman-family">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wakeman-family">Wakeman Family</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="absolute inset-0 pt-16">
        <MapView
          className="w-full h-full"
          markers={mapMarkers}
          center={{ lat: 40.7589, lng: -73.9851 }}
          zoom={13}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-24 left-4 right-4 z-20 flex gap-3 max-w-md mx-auto">
        <Button 
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          onClick={handleCheckIn}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Check In
        </Button>
        <Button 
          className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
          onClick={handleEmergencySOS}
          disabled={isTriggering}
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          {isTriggering ? 'Sending SOS...' : 'Emergency SOS'}
        </Button>
      </div>

      {/* Bottom Sheet */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 z-30 bg-background rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out",
          bottomSheetExpanded ? "translate-y-0" : "translate-y-[calc(100%-120px)]"
        )}
        style={{ height: bottomSheetExpanded ? '70vh' : '120px' }}
      >
        {/* Sheet Handle */}
        <div 
          className="flex justify-center py-3 cursor-pointer"
          onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
        >
          <div className="w-12 h-1 bg-border rounded-full"></div>
        </div>

        {/* Sheet Header */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Family</h2>
              <Badge variant="secondary" className="text-xs">
                {familyLocations.length} members
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
            >
              {bottomSheetExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Family Members List */}
        <div className="px-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {familyLocations.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                      getStatusColor(member.status)
                    )}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{member.name}</h3>
                      <Badge 
                        variant={member.status === 'live' ? 'default' : member.status === 'alert' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {getStatusText(member.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{member.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{member.lastSeen}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        <span>{member.battery}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="flex items-center justify-around py-2 max-w-md mx-auto">
          {[
            { id: 'location', icon: MapPin, label: 'Location' },
            { id: 'communication', icon: MessageSquare, label: 'Communication', badge: unreadNotifications },
            { id: 'safety', icon: Shield, label: 'Safety' },
            { id: 'membership', icon: Users, label: 'Membership' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabNavigation(tab.id)}
              className={cn(
                "relative flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0",
                selectedTab === tab.id 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5 mb-1" />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>
              <span className="text-xs truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Emergency Disclaimer Dialog */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg max-w-md mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold">Emergency SOS Disclaimer</h2>
            </div>
            <div className="space-y-3 text-sm">
              <p>This feature will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Send emergency notifications to your family members</li>
                <li>Share your current location</li>
                <li>Alert emergency contacts you have configured</li>
              </ul>
              <p className="text-red-600 font-medium">
                This is for real emergencies only. Do not use if you need immediate emergency services - call 911 directly.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={cancelDisclaimer} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  acceptDisclaimer();
                  handleEmergencySOS();
                }} 
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                I Understand, Send SOS
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyAppPage;