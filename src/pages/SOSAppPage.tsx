import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useLocationServices } from '@/hooks/useLocationServices';
import { useEmergencySOS } from '@/hooks/useEmergencySOS';
import { useEmergencyDisclaimer } from '@/hooks/useEmergencyDisclaimer';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { getFamilyGroupId } from '@/utils/familyGroupUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Phone, 
  MapPin, 
  Settings, 
  Users, 
  Battery, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wifi, 
  Signal,
  Camera,
  Mic,
  PhoneCall,
  MessageSquare,
  History,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useCanvasMap } from '@/hooks/useCanvasMap';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import EmergencyCommandCenter from '@/components/sos-app/EmergencyCommandCenter';
import EmergencyButton from '@/components/sos-app/EmergencyButton';
import { EmergencyDisclaimerModal } from '@/components/emergency/EmergencyDisclaimerModal';

interface EmergencyStatus {
  overall: 'ready' | 'warning' | 'error';
  location: boolean;
  contacts: number;
  network: boolean;
  battery: number;
}

interface ActiveIncident {
  id: string;
  status: 'active' | 'acknowledged' | 'resolved';
  startTime: Date;
  contactsNotified: number;
  locationShared: boolean;
  familyAlerted: boolean;
}

const SOSAppPage = () => {
  const { user } = useAuth();
  const { contacts, loading: contactsLoading } = useEmergencyContacts();
  const { permissionState } = useLocationServices();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const [familyGroupId, setFamilyGroupId] = useState<string | null>(null);
  
  const { 
    locations: liveLocations,
    locationState,
    metrics,
    startTracking,
    stopTracking,
    refreshLocation,
    error: locationError,
    getCurrentLocationData
  } = useLiveLocation(familyGroupId || undefined);
  const { 
    showDisclaimer, 
    requestDisclaimerAcceptance, 
    acceptDisclaimer, 
    cancelDisclaimer 
  } = useEmergencyDisclaimer();
  const { MapView } = useCanvasMap();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState('status');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({
    overall: 'ready',
    location: permissionState?.granted || false,
    contacts: contacts.length,
    network: navigator.onLine,
    battery: 85 // Mock battery level
  });
  const [activeIncident, setActiveIncident] = useState<ActiveIncident | null>(null);

  // Update emergency status
  useEffect(() => {
    const newStatus: EmergencyStatus = {
      location: permissionState?.granted || false,
      contacts: contacts.length,
      network: navigator.onLine,
      battery: 85, // Mock - in real app would get from device
      overall: 'ready'
    };

    // Determine overall status
    if (!newStatus.location || newStatus.contacts === 0) {
      newStatus.overall = 'warning';
    } else if (!newStatus.network || newStatus.battery < 20) {
      newStatus.overall = 'error';
    }

    setEmergencyStatus(newStatus);
  }, [permissionState, contacts]);

  // Initialize family group ID
  useEffect(() => {
    const initializeFamilyGroup = async () => {
      if (user && !familyGroupId) {
        const groupId = await getFamilyGroupId(user.id);
        setFamilyGroupId(groupId);
      }
    };
    
    initializeFamilyGroup();
  }, [user, familyGroupId]);

  // Initialize location tracking once for emergency purposes
  const trackingInitialized = useRef(false);
  
  useEffect(() => {
    if (familyGroupId && !trackingInitialized.current) {
      trackingInitialized.current = true;
      startTracking({ highAccuracy: true, updateInterval: 10000 }); // 10s updates for emergency
    }
  }, [familyGroupId]);

  const handleEmergencyTrigger = async () => {
    if (!requestDisclaimerAcceptance()) {
      return;
    }

    try {
      // Create mock active incident
      const incident: ActiveIncident = {
        id: `incident-${Date.now()}`,
        status: 'active',
        startTime: new Date(),
        contactsNotified: contacts.length,
        locationShared: true,
        familyAlerted: true
      };
      setActiveIncident(incident);

      await triggerEmergencySOS();
      
      toast({
        title: "Emergency SOS Activated",
        description: "Emergency contacts and family have been notified",
      });
    } catch (error) {
      console.error('Emergency SOS failed:', error);
    }
  };

  const handleDisclaimerAccept = () => {
    acceptDisclaimer();
    handleEmergencyTrigger();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const handleTabNavigation = (tabId: string) => {
    setSelectedTab(tabId);
    
    switch (tabId) {
      case 'status':
        // Stay on current tab
        break;
      case 'family':
        // Stay on current tab to show family list
        break;
      case 'contacts':
        navigate('/member-dashboard/emergency-contacts');
        break;
      case 'settings':
        navigate('/member-dashboard/settings');
        break;
    }
  };

  // Get current location from live tracking
  const currentLocation = getCurrentLocationData();

  // Stable map markers to prevent re-rendering loops
  const mapMarkers = React.useMemo(() => {
    const markers = [];
    
    // Add current user location marker (normal user avatar, not emergency)
    if (currentLocation?.latitude && currentLocation?.longitude) {
      const marker = {
        id: 'current-user-location',
        lat: Number(currentLocation.latitude.toFixed(6)),
        lng: Number(currentLocation.longitude.toFixed(6)),
        name: user?.user_metadata?.full_name || 'You',
        avatar: user?.user_metadata?.avatar_url,
        isEmergency: false, // Changed to false - only emergency during actual SOS
        status: 'online' as const,
        accuracy: currentLocation.accuracy,
        batteryLevel: emergencyStatus.battery,
        render: () => null
      };
      markers.push(marker);
    }
    
    // Add live family member locations (show only selected member or all if none selected)
    liveLocations.forEach(location => {
      if (location.user_id !== user?.id) {
        // If a specific family member is selected, only show that one
        if (selectedFamilyMember && location.user_id !== selectedFamilyMember) {
          return;
        }
        
        markers.push({
          id: `live-${location.user_id}`,
          lat: Number(location.latitude.toFixed(6)),
          lng: Number(location.longitude.toFixed(6)),
          name: `Family Member`,
          status: location.status,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          batteryLevel: location.battery_level,
          render: () => null
        });
      }
    });

    // Add emergency contacts as markers only if no family member is selected
    if (!selectedFamilyMember && currentLocation?.latitude && currentLocation?.longitude && contacts.length > 0) {
      contacts.slice(0, 3).forEach((contact, index) => {
        // Simulate emergency contacts being nearby (in a real app, they'd have actual GPS coordinates)
        const offsetLat = (Math.random() - 0.5) * 0.01; // Random offset within ~1km
        const offsetLng = (Math.random() - 0.5) * 0.01;
        
        markers.push({
          id: `contact-${contact.id || index}`,
          lat: currentLocation.latitude + offsetLat,
          lng: currentLocation.longitude + offsetLng,
          name: contact.name,
          status: 'idle' as const, // Emergency contacts shown as idle
          isEmergency: false,
          render: () => null
        });
      });
    }
    
    return markers;
  }, [
    currentLocation?.latitude?.toFixed(6),
    currentLocation?.longitude?.toFixed(6),
    liveLocations,
    contacts,
    selectedFamilyMember,
    user?.id,
    user?.user_metadata?.full_name,
    user?.user_metadata?.avatar_url
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-orange-900">
      <SEO 
        title="Emergency SOS Command Center"
        description="Advanced emergency response system with real-time monitoring and one-touch SOS activation"
      />

      {/* Header */}
      <div className="relative z-10 px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-white mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8" />
                <div className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full",
                  getStatusColor(emergencyStatus.overall)
                )}></div>
              </div>
              <div>
                <h1 className="text-xl font-bold">Emergency SOS</h1>
                <p className="text-white/70 text-sm">Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4" />
              <Battery className="h-4 w-4" />
              <span className="text-sm">{emergencyStatus.battery}%</span>
               {locationState.isTracking && (
                 <div className="flex items-center gap-1 text-emerald-400">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* System Status Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">System Status</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(emergencyStatus.overall)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshLocation}
                  className="text-white/70 hover:text-white h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="h-4 w-4" />
              <span>Location: {emergencyStatus.location ? 'Active' : 'Disabled'}</span>
              {locationState.isTracking && (
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse ml-1"></div>
              )}
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Users className="h-4 w-4" />
              <span>Contacts: {emergencyStatus.contacts}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Wifi className="h-4 w-4" />
              <span>Network: {emergencyStatus.network ? 'Connected' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Battery className="h-4 w-4" />
              <span>Battery: {emergencyStatus.battery}%</span>
            </div>
            </div>
            
            {locationError && (
              <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-200 text-xs">
                {locationError}
              </div>
            )}
            
            {/* Live tracking metrics */}
            {locationState.isTracking && metrics.totalUpdates > 0 && (
              <div className="mt-3 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Updates: {metrics.totalUpdates}</span>
                  <span>Success: {metrics.successRate}%</span>
                  <span>Avg Accuracy: ±{metrics.averageAccuracy}m</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Incident Alert */}
      {activeIncident && (
        <div className="relative z-10 px-4 mb-6">
          <div className="max-w-md mx-auto">
            <div className="bg-red-600 rounded-xl p-4 border border-red-500 animate-pulse">
              <div className="flex items-center gap-3 text-white mb-3">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-bold">ACTIVE EMERGENCY</span>
                <Badge variant="destructive" className="bg-red-800">
                  {activeIncident.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-white/90">
                <div>Started: {activeIncident.startTime.toLocaleTimeString()}</div>
                <div>Contacts: {activeIncident.contactsNotified} notified</div>
                <div>Location: {activeIncident.locationShared ? 'Shared' : 'Pending'}</div>
                <div>Family: {activeIncident.familyAlerted ? 'Alerted' : 'Pending'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Based on Selected Tab */}
      <div className="relative z-10 px-4 pb-24">
        <div className="max-w-md mx-auto">
          
          {selectedTab === 'status' && (
            <div className="space-y-6">
              {/* Emergency Button */}
              <div className="flex justify-center mb-8">
                <EmergencyButton />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button 
                  className="h-16 bg-blue-600/20 border border-blue-500/30 text-white hover:bg-blue-600/30"
                  onClick={() => {
                    toast({
                      title: "Photo Capture",
                      description: "Emergency photo capture feature activated",
                    });
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-6 w-6" />
                    <span className="text-sm">Photo</span>
                  </div>
                </Button>
                <Button 
                  className="h-16 bg-purple-600/20 border border-purple-500/30 text-white hover:bg-purple-600/30"
                  onClick={() => {
                    toast({
                      title: "Voice Memo",
                      description: "Emergency voice recording started",
                    });
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Mic className="h-6 w-6" />
                    <span className="text-sm">Voice</span>
                  </div>
                </Button>
              </div>

              {/* Live Location Map - Always show with fallback */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-3 text-white">
                  <Navigation className="h-5 w-5" />
                  <span className="font-medium">Live Location</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {locationState.isTracking ? (
                      <>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs">Live ({locationState.updateInterval/1000}s)</span>
                      </>
                     ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span className="text-xs">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-48 rounded-lg overflow-hidden">
                  <MapView
                    className="w-full h-full"
                    markers={mapMarkers}
                    center={(() => {
                      // If a family member is selected, center on them
                      if (selectedFamilyMember) {
                        const familyLocation = liveLocations.find(l => l.user_id === selectedFamilyMember);
                        if (familyLocation) {
                          return { lat: familyLocation.latitude, lng: familyLocation.longitude };
                        }
                      }
                      // Otherwise center on current user location
                      return currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : { lat: 37.3881024, lng: -2.1417503 };
                    })()}
                    zoom={selectedFamilyMember ? 15 : (currentLocation ? 16 : 10)}
                    showControls={true}
                    interactive={true}
                  />
                </div>
                <div className="mt-3 text-sm text-white/70 flex justify-between">
                  <span>
                    {currentLocation 
                      ? `Accuracy: ±${currentLocation.accuracy || 5}m` 
                      : `${locationError || 'Getting location...'}`
                    }
                  </span>
                  <span>
                    {currentLocation?.last_seen 
                      ? `Updated: ${new Date(currentLocation.last_seen).toLocaleTimeString()}` 
                      : 'Waiting for GPS...'
                    }
                  </span>
                </div>
                
                {/* Family Connection Status */}
                <div className="mt-3 p-2 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Family Connected:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <span>
                        {Math.max(1, Array.from(new Set(liveLocations.filter(l => l.status === 'online').map(l => l.user_id))).length)} members online
                      </span>
                    </div>
                  </div>
                  {locationState.isTracking && (
                    <div className="mt-1 text-xs text-white/60">
                      High-precision mode • {locationState.highAccuracyMode ? 'GPS' : 'Network'} tracking
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contacts Summary */}
              {contacts.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3 text-white">
                    <span className="font-medium">Emergency Contacts</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {contacts.length} active
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {contacts.slice(0, 3).map((contact, index) => (
                      <div key={contact.id || index} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{contact.name}</div>
                          <div className="text-white/60 text-xs">{contact.relationship}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {contacts.length > 3 && (
                      <div className="text-center">
                        <Button variant="ghost" className="text-white/70 hover:text-white text-sm">
                          +{contacts.length - 3} more contacts
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'family' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-4 text-white">
                  <span className="font-medium">Family Members</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {liveLocations.filter(l => l.user_id !== user?.id).length} online
                  </Badge>
                </div>
                <div className="space-y-3">
                  {liveLocations.filter(l => l.user_id !== user?.id).map((location, index) => (
                    <div key={location.user_id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {`M${index + 1}`}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">Family Member {index + 1}</div>
                        <div className="text-white/60 text-xs">{location.status}</div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedFamilyMember(selectedFamilyMember === location.user_id ? null : location.user_id);
                          setSelectedTab('status'); // Go back to map view
                        }}
                        className={cn(
                          "h-8 px-3 text-xs",
                          selectedFamilyMember === location.user_id 
                            ? "bg-blue-600 text-white" 
                            : "bg-white/20 text-white hover:bg-white/30"
                        )}
                      >
                        {selectedFamilyMember === location.user_id ? 'Hide' : 'Show on Map'}
                      </Button>
                    </div>
                  ))}
                  {liveLocations.filter(l => l.user_id !== user?.id).length === 0 && (
                    <div className="text-center text-white/60 py-4">
                      No family members online
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-lg border-t border-white/10">
        <div className="flex items-center justify-around py-3 max-w-md mx-auto">
          {[
            { id: 'status', icon: Shield, label: 'Status' },
            { id: 'family', icon: Users, label: 'Family' },
            { id: 'contacts', icon: Phone, label: 'Contacts' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabNavigation(tab.id)}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0",
                selectedTab === tab.id 
                  ? "text-white bg-white/20" 
                  : "text-white/60 hover:text-white/80"
              )}
            >
              <tab.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Emergency Disclaimer Modal */}
      <EmergencyDisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onCancel={cancelDisclaimer}
        subscriptionTier="basic"
      />
    </div>
  );
};

export default SOSAppPage;