import type { ReactNode } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  MapPin, Users, Shield, Battery,
  CheckCircle2, AlertTriangle, Bell, Wifi, RefreshCw,
  PhoneCall, MessageSquare, MapPinOff, Navigation,
  ArrowUpCircle, Heart, Eye, ChevronRight
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
    let overall: 'ready' | 'warning' | 'error' = 'ready';
    const locationActive = permissionState?.granted || false;
    const contactCount = contacts.length;
    const networkOnline = navigator.onLine;
    if (!locationActive || contactCount === 0) overall = 'warning';
    else if (!networkOnline) overall = 'error';
    const status = {
      location: locationActive,
      contacts: contactCount,
      network: networkOnline,
      battery: 85,
      overall
    };
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

  const handleCheckIn = async () => {
    try {
      await supabase.functions.invoke('family-sos-alerts', {
        body: { alert_type: 'family_check_in', message: 'Family member has checked in safely', user_name: user?.user_metadata?.first_name || 'Family Member' }
      });
      toast({ title: "Check-in Sent", description: "Your family has been notified you're safe" });
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Family App" description="Stay connected with your family circle" />

      {/* ─── HEADER ─── */}
      <div className="bg-background border-b px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">LifeLink Family</h1>
                <p className="text-xs text-muted-foreground">
                  {onlineFamilyCount > 0 ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                      {onlineFamilyCount} member{onlineFamilyCount !== 1 ? 's' : ''} online
                    </span>
                  ) : (
                    'No members online'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {locationState.isTracking && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">Live</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={refreshLocation} className="h-8 w-8 p-0">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto">

          {/* ═══════════════════════════════════════════════
              LOCATION TAB
              ═══════════════════════════════════════════════ */}
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

                {/* Clean map overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-background/90 backdrop-blur-sm rounded-xl px-4 py-2.5 border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {currentLocation ? 'Location active' : (locationError || 'Getting location...')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{mapEntities.length} on map</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-4 py-3 flex gap-3">
                <Button
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm"
                  onClick={handleCheckIn}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I'm Safe
                </Button>
                <Button
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                  onClick={handleEmergencyTrigger}
                  disabled={isTriggering}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isTriggering ? 'Sending...' : 'SOS'}
                </Button>
              </div>

              {/* Family member list */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Circle</h2>
                  <span className="text-xs text-muted-foreground">{activeFamilyMembers.length} member{activeFamilyMembers.length !== 1 ? 's' : ''}</span>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse p-3 rounded-xl bg-muted/30">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-1.5"><div className="h-3.5 bg-muted rounded w-1/3" /><div className="h-3 bg-muted rounded w-1/4" /></div>
                      </div>
                    ))}
                  </div>
                ) : activeFamilyMembers.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No family members yet</p>
                    <p className="text-xs text-muted-foreground">Ask a LifeLink member to add you to their circle</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeFamilyMembers.map((member) => {
                      const memberLocation = liveLocations.find(l => l.user_id === member.id);
                      const isOnline = memberLocation?.status === 'online';
                      const isSelected = selectedFamilyMember === member.id;

                      return (
                        <div
                          key={member.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary/5 border border-primary/20 shadow-sm"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedFamilyMember(isSelected ? null : member.id)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name || member.email}`} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {(member.name || member.email.split('@')[0]).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                              isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name || member.email.split('@')[0]}</p>
                            <p className="text-xs text-muted-foreground">
                              {isOnline ? (
                                <span className="text-green-600 dark:text-green-400">Online now</span>
                              ) : (
                                'Offline'
                              )}
                              {memberLocation?.battery_level != null && (
                                <span className="ml-2 inline-flex items-center gap-0.5">
                                  <Battery className="h-3 w-3" />{memberLocation.battery_level}%
                                </span>
                              )}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="text-xs text-primary font-medium">Viewing</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              ALERTS TAB
              ═══════════════════════════════════════════════ */}
          {selectedTab === 'alerts' && (
            <div className="px-4 py-5 space-y-5">
              {/* Quick check-in card */}
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Quick Check-in</h3>
                    <p className="text-xs text-muted-foreground">Let your family know you're safe</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={handleCheckIn}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />Send Check-in
                </Button>
              </div>

              {/* Alerts section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alerts</h2>
                  {unreadNotifications > 0 && (
                    <Badge variant="destructive" className="text-xs">{unreadNotifications} new</Badge>
                  )}
                </div>

                {unreadNotifications === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">All caught up</p>
                    <p className="text-xs text-muted-foreground">No new alerts from your family circle</p>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{unreadNotifications} unread alert{unreadNotifications !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-muted-foreground">Tap to view your notifications</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency contacts */}
              {contacts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Emergency Contacts</h2>
                  <div className="space-y-1.5">
                    {contacts.slice(0, 4).map((contact, index) => (
                      <div key={contact.id || index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => window.open(`tel:${contact.phone}`)}>
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => window.open(`sms:${contact.phone}`)}>
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

          {/* ═══════════════════════════════════════════════
              SAFETY TAB
              ═══════════════════════════════════════════════ */}
          {selectedTab === 'safety' && (
            <div className="px-4 py-5 space-y-5">
              {/* Emergency SOS */}
              <div className="flex justify-center py-4">
                <EmergencyButton />
              </div>

              {/* System status */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  System Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatusItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Location"
                    value={systemStatus.location ? 'Active' : 'Disabled'}
                    isActive={systemStatus.location}
                    pulse={locationState.isTracking}
                  />
                  <StatusItem
                    icon={<Users className="h-4 w-4" />}
                    label="Contacts"
                    value={`${systemStatus.contacts} saved`}
                    isActive={systemStatus.contacts > 0}
                  />
                  <StatusItem
                    icon={<Wifi className="h-4 w-4" />}
                    label="Network"
                    value={systemStatus.network ? 'Connected' : 'Offline'}
                    isActive={systemStatus.network}
                  />
                  <StatusItem
                    icon={<Battery className="h-4 w-4" />}
                    label="Battery"
                    value={`${systemStatus.battery}%`}
                    isActive={systemStatus.battery > 20}
                  />
                </div>
                {locationError && (
                  <div className="p-2.5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
                    {locationError}
                  </div>
                )}
              </div>

              {/* Emergency contacts */}
              {contacts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Emergency Contacts</h2>
                  <div className="space-y-1.5">
                    {contacts.slice(0, 3).map((contact, index) => (
                      <div key={contact.id || index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => window.open(`tel:${contact.phone}`)}>
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              CIRCLE TAB
              ═══════════════════════════════════════════════ */}
          {selectedTab === 'circle' && (
            <div className="px-4 py-5 space-y-5">

              {/* Location sharing controls */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location Sharing</h2>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose who can see your location. Each person controls their own sharing independently.
                  </p>

                  {familyConnections.filter(c => c.status === 'active').length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No active connections yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {familyConnections.filter(c => c.status === 'active').map(connection => (
                        <div key={connection.id} className="flex items-center justify-between py-2 border-b last:border-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{connection.invite_email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {connection.relationship && (
                                <span className="text-xs text-muted-foreground">{connection.relationship}</span>
                              )}
                              {connection.contact_share_location ? (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" />Sharing with you
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <MapPinOff className="h-3 w-3" />Not sharing
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Share mine</span>
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
              </div>

              {/* Family members list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Members</h2>
                  <span className="text-xs text-muted-foreground">{activeFamilyMembers.length} active</span>
                </div>

                {activeFamilyMembers.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No members in your circle</p>
                    <p className="text-xs text-muted-foreground">A LifeLink member can add you to their circle from the Member Dashboard</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeFamilyMembers.map(member => {
                      const memberLocation = liveLocations.find(l => l.user_id === member.id);
                      const isOnline = memberLocation?.status === 'online';

                      return (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name || member.email}`} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {(member.name || member.email.split('@')[0]).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                              isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name || member.email.split('@')[0]}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                            {isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upgrade to Member CTA */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-1">Upgrade to Member</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Get full LifeLink benefits — create your own circle, manage emergency contacts, access professional monitoring, and more.
                    </p>
                    <Button size="sm" className="w-full" onClick={() => navigate('/pricing')}>
                      View Plans
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM NAVIGATION ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around py-1.5 max-w-lg mx-auto">
          {[
            { id: 'location', icon: MapPin, label: 'Location' },
            { id: 'alerts', icon: Bell, label: 'Alerts', badge: unreadNotifications },
            { id: 'safety', icon: Shield, label: 'Safety' },
            { id: 'circle', icon: Users, label: 'Circle' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center py-2 px-5 rounded-xl transition-all min-w-0",
                selectedTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className={cn("h-5 w-5 mb-0.5", selectedTab === tab.id && "stroke-[2.5]")} />
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center font-medium">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>
              <span className={cn("text-[11px]", selectedTab === tab.id ? "font-semibold" : "font-medium")}>{tab.label}</span>
              {selectedTab === tab.id && (
                <div className="absolute -bottom-1.5 w-5 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Disclaimer Modal */}
      <EmergencyDisclaimerModal isOpen={showDisclaimer} onAccept={handleDisclaimerAccept} onCancel={cancelDisclaimer} subscriptionTier="basic" />
    </div>
  );
};

/* ─── STATUS ITEM COMPONENT ─── */
const StatusItem = ({ icon, label, value, isActive, pulse }: {
  icon: ReactNode;
  label: string;
  value: string;
  isActive: boolean;
  pulse?: boolean;
}) => (
  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
    <div className={cn("text-muted-foreground", isActive && "text-green-600 dark:text-green-400")}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{value}</p>
        {pulse && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      </div>
    </div>
  </div>
);

export default FamilyAppPage;
