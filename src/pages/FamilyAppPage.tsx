import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useLocationServices } from '@/hooks/useLocationServices';
import { useConnections, useConnectionActions } from '@/hooks/useConnections';
import { getFamilyGroupId } from '@/utils/familyGroupUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  MapPin, Users, MessageSquare, Shield, Battery, Clock,
  CheckCircle2, AlertTriangle, Bell, Signal, Wifi, RefreshCw,
  PhoneCall, UserPlus, MapPinOff, Navigation, Copy, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import MapLibreMap from '@/components/maplibre/MapLibreMap';
import { MapMemberLayer } from '@/components/maplibre/layers/MapMemberLayer';
import { useEmergencySOS } from '@/hooks/useEmergencySOS';
import { useEmergencyDisclaimer } from '@/hooks/useEmergencyDisclaimer';
import EmergencyButton from '@/components/sos-app/EmergencyButton';
import { EmergencyDisclaimerModal } from '@/components/emergency/EmergencyDisclaimerModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MapEntity, getStatusFromPresence } from '@/types/map';

const FamilyAppPage = () => {
  const { user } = useAuth();
  const { data: familyRole } = useFamilyRole();
  const { data: familyData, isLoading } = useFamilyMembers(familyRole?.familyGroupId);
  const { contacts } = useEmergencyContacts();
  const { permissionState } = useLocationServices();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const { showDisclaimer, requestDisclaimerAcceptance, acceptDisclaimer, cancelDisclaimer } = useEmergencyDisclaimer();
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { updateLocationSharing } = useConnectionActions();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [familyGroupId, setFamilyGroupId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('location');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string | null>(null);

  // Live location tracking
  const {
    locations: liveLocations, locationState, metrics,
    startTracking, refreshLocation,
    error: locationError, getCurrentLocationData
  } = useLiveLocation(familyGroupId || undefined);

  // System status
  const [systemStatus, setSystemStatus] = useState({
    location: false,
    contacts: 0,
    network: navigator.onLine,
    battery: 85,
    overall: 'ready' as 'ready' | 'warning' | 'error'
  });

  // Initialize family group and tracking
  useEffect(() => {
    const init = async () => {
      if (user && !familyGroupId) {
        const groupId = await getFamilyGroupId(user.id);
        setFamilyGroupId(groupId);
      }
    };
    init();
  }, [user, familyGroupId]);

  const trackingInitialized = useRef(false);
  useEffect(() => {
    if (familyGroupId && !trackingInitialized.current) {
      trackingInitialized.current = true;
      startTracking({ highAccuracy: true, updateInterval: 10000 });
    }
  }, [familyGroupId]);

  // Update system status
  useEffect(() => {
    const status = {
      location: permissionState?.granted || false,
      contacts: contacts.length,
      network: navigator.onLine,
      battery: 85,
      overall: 'ready' as const
    };
    if (!status.location || status.contacts === 0) status.overall = 'warning';
    else if (!status.network || status.battery < 20) status.overall = 'error';
    setSystemStatus(status);
  }, [permissionState, contacts]);

  // Load notification count
  useEffect(() => {
    if (!user) return;
    const loadNotificationsCount = async () => {
      try {
        const { data } = await supabase.from('family_alerts').select('id').eq('family_user_id', user.id).neq('status', 'read');
        setUnreadNotifications(data?.length || 0);
      } catch (error) { console.error('Error loading notifications count:', error); }
    };
    loadNotificationsCount();
    const channel = supabase.channel('family-notification-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_alerts', filter: `family_user_id=eq.${user.id}` }, () => loadNotificationsCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const currentLocation = getCurrentLocationData();

  // Build map entities from real live location data
  const mapEntities: MapEntity[] = useMemo(() => {
    const entities: MapEntity[] = [];

    if (currentLocation?.latitude && currentLocation?.longitude) {
      entities.push({
        id: 'current-user',
        type: 'member',
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        label: user?.user_metadata?.full_name || user?.user_metadata?.first_name || 'You',
        avatar_url: user?.user_metadata?.avatar_url,
        status: 'live',
        accuracy: currentLocation.accuracy,
        battery: systemStatus.battery,
      });
    }

    liveLocations.forEach(location => {
      if (location.user_id !== user?.id) {
        if (selectedFamilyMember && location.user_id !== selectedFamilyMember) return;
        const member = familyData?.members?.find(m => m.id === location.user_id);
        entities.push({
          id: `live-${location.user_id}`,
          type: 'member',
          lat: location.latitude,
          lng: location.longitude,
          label: member?.name || member?.email?.split('@')[0] || 'Family Member',
          status: getStatusFromPresence(undefined, false),
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          battery: location.battery_level,
        });
      }
    });

    return entities;
  }, [currentLocation, liveLocations, selectedFamilyMember, user, familyData]);

  const mapCenter = useMemo(() => {
    if (selectedFamilyMember) {
      const loc = liveLocations.find(l => l.user_id === selectedFamilyMember);
      if (loc) return { lat: loc.latitude, lng: loc.longitude };
    }
    return currentLocation
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: 37.3881024, lng: -2.1417503 };
  }, [currentLocation, selectedFamilyMember, liveLocations]);

  const activeFamilyMembers = familyData?.members?.filter(m => m.status === 'active') || [];
  const onlineFamilyCount = liveLocations.filter(l => l.user_id !== user?.id && l.status === 'online').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'live': return 'bg-green-500';
      case 'alert': return 'bg-red-500';
      case 'idle': case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const handleCheckIn = async () => {
    try {
      await supabase.functions.invoke('family-sos-alerts', {
        body: { alert_type: 'family_check_in', message: 'Family member has checked in safely', user_name: user?.user_metadata?.first_name || 'Family Member' }
      });
      toast({ title: "Check-in Sent", description: "Family has been notified of your safe check-in" });
    } catch {
      toast({ title: "Check-in Failed", description: "Could not send check-in notification", variant: "destructive" });
    }
  };

  const handleEmergencyTrigger = async () => {
    if (!requestDisclaimerAcceptance()) return;
    try { await triggerEmergencySOS(); } catch { /* handled by hook */ }
  };

  const handleDisclaimerAccept = () => {
    acceptDisclaimer();
    handleEmergencyTrigger();
  };

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/connections/${token}`);
    toast({ title: "Link Copied", description: "Invite link copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Family App" description="Family location tracking, communication, and safety" />

      {/* Header with system status */}
      <div className="bg-background border-b px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Users className="h-7 w-7 text-primary" />
                <div className={cn("absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background", getStatusColor(systemStatus.overall === 'ready' ? 'online' : systemStatus.overall))} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Family App</h1>
                <p className="text-xs text-muted-foreground">{onlineFamilyCount} member{onlineFamilyCount !== 1 ? 's' : ''} online</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Signal className="h-4 w-4" />
              <Battery className="h-4 w-4" />
              <span className="text-xs">{systemStatus.battery}%</span>
              {locationState.isTracking && (
                <div className="flex items-center gap-1 text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* System status bar */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{systemStatus.location ? 'Active' : 'Off'}</span>
              {locationState.isTracking && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{systemStatus.contacts} contacts</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wifi className="h-3 w-3" />
              <span>{systemStatus.network ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Button variant="ghost" size="sm" onClick={refreshLocation} className="h-6 w-6 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto">

          {/* ─── LOCATION TAB ─── */}
          {selectedTab === 'location' && (
            <div className="flex flex-col">
              {/* Map */}
              <div className="h-[45vh] relative">
                <MapLibreMap
                  className="w-full h-full"
                  center={mapCenter}
                  zoom={selectedFamilyMember ? 15 : (currentLocation ? 14 : 10)}
                  interactive={true}
                >
                  <MapMemberLayer members={mapEntities} />
                </MapLibreMap>

                {/* Map overlay */}
                <div className="absolute bottom-3 left-3 right-3 bg-background/90 backdrop-blur-sm rounded-xl p-3 border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {currentLocation ? `Accuracy: \u00b1${currentLocation.accuracy || 5}m` : (locationError || 'Getting location...')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-xs">{mapEntities.length} on map</span>
                    </div>
                  </div>
                  {locationState.isTracking && metrics.totalUpdates > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                      <span>Updates: {metrics.totalUpdates}</span>
                      <span>Success: {metrics.successRate}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-4 py-3 flex gap-3">
                <Button className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg" onClick={handleCheckIn}>
                  <CheckCircle2 className="h-5 w-5 mr-2" />Check In
                </Button>
                <Button className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg" onClick={handleEmergencyTrigger} disabled={isTriggering}>
                  <AlertTriangle className="h-5 w-5 mr-2" />{isTriggering ? 'Sending...' : 'Emergency SOS'}
                </Button>
              </div>

              {/* Family member list */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Family Members</h2>
                    <Badge variant="secondary" className="text-xs">{activeFamilyMembers.length}</Badge>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 animate-pulse p-3 rounded-xl bg-muted/50">
                        <div className="w-12 h-12 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-1/3" /><div className="h-3 bg-muted rounded w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : activeFamilyMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">No family members yet</p>
                    <Button size="sm" onClick={() => setSelectedTab('membership')}>
                      <UserPlus className="h-4 w-4 mr-2" />Invite Family
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeFamilyMembers.map((member) => {
                      const memberLocation = liveLocations.find(l => l.user_id === member.id);
                      const isOnline = memberLocation?.status === 'online';
                      const isSelected = selectedFamilyMember === member.id;

                      return (
                        <div
                          key={member.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                            isSelected ? "bg-primary/10 border border-primary/20" : "bg-muted/50 hover:bg-muted"
                          )}
                          onClick={() => setSelectedFamilyMember(isSelected ? null : member.id)}
                        >
                          <div className="relative">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name || member.email}`} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                {(member.name || member.email.split('@')[0]).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background", isOnline ? 'bg-green-500' : 'bg-gray-400')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm truncate">{member.name || member.email.split('@')[0]}</h3>
                              <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                                {isOnline ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {memberLocation ? (
                                <>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {memberLocation.accuracy ? `\u00b1${Math.round(memberLocation.accuracy)}m` : 'Located'}
                                  </span>
                                  {memberLocation.battery_level != null && (
                                    <span className="flex items-center gap-1">
                                      <Battery className="h-3 w-3" />
                                      {memberLocation.battery_level}%
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span>No location data</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedFamilyMember(null); }}>
                              Hide
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── COMMUNICATION TAB ─── */}
          {selectedTab === 'communication' && (
            <div className="px-4 py-4 space-y-4">
              <h2 className="text-lg font-semibold">Notifications & Alerts</h2>

              {/* Quick check-in */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  Quick Check-in
                </h3>
                <p className="text-sm text-muted-foreground mb-3">Let your family know you're safe with a quick check-in.</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCheckIn}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />Send Check-in
                </Button>
              </div>

              {/* Family alerts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Recent Alerts</h3>
                  <Badge variant="secondary">{unreadNotifications} unread</Badge>
                </div>

                {unreadNotifications === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{unreadNotifications} unread alert{unreadNotifications !== 1 ? 's' : ''}</p>
                    <p className="text-xs mt-1">Check your notifications to stay up to date</p>
                  </div>
                )}
              </div>

              {/* Emergency contacts quick call */}
              {contacts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Emergency Contacts</h3>
                  <div className="space-y-2">
                    {contacts.slice(0, 4).map((contact, index) => (
                      <div key={contact.id || index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open(`tel:${contact.phone}`)}>
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open(`sms:${contact.phone}`)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── SAFETY TAB ─── */}
          {selectedTab === 'safety' && (
            <div className="px-4 py-4 space-y-6">
              <h2 className="text-lg font-semibold">Safety Center</h2>

              {/* Emergency button */}
              <div className="flex justify-center py-4">
                <EmergencyButton />
              </div>

              {/* System status card */}
              <div className="bg-muted/50 rounded-xl p-4 border space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  System Status
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Location: {systemStatus.location ? 'Active' : 'Disabled'}</span>
                    {locationState.isTracking && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Contacts: {systemStatus.contacts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span>Network: {systemStatus.network ? 'Connected' : 'Offline'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <span>Battery: {systemStatus.battery}%</span>
                  </div>
                </div>
                {locationError && (
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    {locationError}
                  </div>
                )}
                {locationState.isTracking && metrics.totalUpdates > 0 && (
                  <div className="text-xs text-muted-foreground flex justify-between pt-1 border-t">
                    <span>Updates: {metrics.totalUpdates}</span>
                    <span>Success: {metrics.successRate}%</span>
                    <span>Avg Accuracy: \u00b1{metrics.averageAccuracy}m</span>
                  </div>
                )}
              </div>

              {/* Live location map */}
              <div className="rounded-xl overflow-hidden border">
                <div className="p-3 bg-muted/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Live Location</span>
                  </div>
                  {locationState.isTracking ? (
                    <div className="flex items-center gap-1 text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs">Live ({locationState.updateInterval / 1000}s)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Offline</span>
                  )}
                </div>
                <div className="h-48">
                  <MapLibreMap className="w-full h-full" center={mapCenter} zoom={currentLocation ? 16 : 10} interactive={true}>
                    <MapMemberLayer members={mapEntities} />
                  </MapLibreMap>
                </div>
              </div>

              {/* Emergency contacts */}
              {contacts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Emergency Contacts</h3>
                    <Badge variant="secondary">{contacts.length} active</Badge>
                  </div>
                  <div className="space-y-2">
                    {contacts.slice(0, 3).map((contact, index) => (
                      <div key={contact.id || index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open(`tel:${contact.phone}`)}>
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── MEMBERSHIP TAB ─── */}
          {selectedTab === 'membership' && (
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Family Circle</h2>
                <Badge variant="secondary">{activeFamilyMembers.length} members</Badge>
              </div>

              {/* Location sharing controls */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Location Sharing
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Control who can see your location. Each person independently chooses whether to share.
                </p>

                {familyConnections.filter(c => c.status === 'active').length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active connections yet.</p>
                ) : (
                  <div className="space-y-3">
                    {familyConnections.filter(c => c.status === 'active').map(connection => (
                      <div key={connection.id} className="flex items-center justify-between p-2 rounded-lg bg-background/60">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{connection.invite_email}</p>
                          {connection.relationship && (
                            <p className="text-xs text-muted-foreground">{connection.relationship}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            {connection.contact_share_location ? (
                              <span className="text-xs text-green-600 flex items-center gap-1"><MapPin className="h-3 w-3" />Sharing with you</span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPinOff className="h-3 w-3" />Not sharing with you</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Share mine</p>
                          </div>
                          <Switch
                            checked={connection.share_my_location}
                            onCheckedChange={(checked) =>
                              updateLocationSharing.mutate({ connectionId: connection.id, shareMyLocation: checked })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Family members */}
              <div>
                <h3 className="font-medium mb-3">Members</h3>
                {activeFamilyMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">No family members yet. Invite someone to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeFamilyMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name || member.email}`} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {(member.name || member.email.split('@')[0]).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name || member.email.split('@')[0]}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending invitations */}
              {familyConnections.filter(c => c.status === 'pending').length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Pending Invitations</h3>
                  <div className="space-y-2">
                    {familyConnections.filter(c => c.status === 'pending').map(connection => (
                      <div key={connection.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border-dashed border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Crown className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{connection.invite_email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited {connection.invited_at ? new Date(connection.invited_at).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                        {connection.invite_token && (
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => copyInviteLink(connection.invite_token!)}>
                            <Copy className="h-3 w-3 mr-1" />Copy Link
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite button */}
              <Button className="w-full" onClick={() => navigate('/member-dashboard/circles')}>
                <UserPlus className="h-4 w-4 mr-2" />Invite Family Member
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM NAVIGATION ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {[
            { id: 'location', icon: MapPin, label: 'Location' },
            { id: 'communication', icon: MessageSquare, label: 'Messages', badge: unreadNotifications },
            { id: 'safety', icon: Shield, label: 'Safety' },
            { id: 'membership', icon: Users, label: 'Circle' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center py-2 px-4 rounded-lg transition-colors min-w-0",
                selectedTab === tab.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5 mb-1" />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Disclaimer Modal */}
      <EmergencyDisclaimerModal isOpen={showDisclaimer} onAccept={handleDisclaimerAccept} onCancel={cancelDisclaimer} subscriptionTier="basic" />
    </div>
  );
};

export default FamilyAppPage;
