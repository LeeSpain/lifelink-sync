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
import {
  Shield, Phone, MapPin, Settings, Users, Battery, Clock, AlertTriangle,
  CheckCircle2, Wifi, Signal, Camera, Mic, PhoneCall, MessageSquare,
  History, Navigation, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import MapLibreMap from '@/components/maplibre/MapLibreMap';
import { MapMemberLayer } from '@/components/maplibre/layers/MapMemberLayer';
import { MapIncidentLayer } from '@/components/maplibre/layers/MapIncidentLayer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import EmergencyCommandCenter from '@/components/sos-app/EmergencyCommandCenter';
import EmergencyButton from '@/components/sos-app/EmergencyButton';
import { EmergencyDisclaimerModal } from '@/components/emergency/EmergencyDisclaimerModal';
import { MapEntity, getStatusFromPresence } from '@/types/map';

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { contacts, loading: contactsLoading } = useEmergencyContacts();
  const { permissionState } = useLocationServices();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const [familyGroupId, setFamilyGroupId] = useState<string | null>(null);

  const {
    locations: liveLocations, locationState, metrics,
    startTracking, stopTracking, refreshLocation,
    error: locationError, getCurrentLocationData
  } = useLiveLocation(familyGroupId || undefined);
  const { showDisclaimer, requestDisclaimerAcceptance, acceptDisclaimer, cancelDisclaimer } = useEmergencyDisclaimer();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState('status');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({
    overall: 'ready',
    location: permissionState?.granted || false,
    contacts: contacts.length,
    network: navigator.onLine,
    battery: 85
  });
  const [activeIncident, setActiveIncident] = useState<ActiveIncident | null>(null);

  useEffect(() => {
    const newStatus: EmergencyStatus = {
      location: permissionState?.granted || false,
      contacts: contacts.length,
      network: navigator.onLine,
      battery: 85,
      overall: 'ready'
    };
    if (!newStatus.location || newStatus.contacts === 0) newStatus.overall = 'warning';
    else if (!newStatus.network || newStatus.battery < 20) newStatus.overall = 'error';
    setEmergencyStatus(newStatus);
  }, [permissionState, contacts]);

  useEffect(() => {
    const initializeFamilyGroup = async () => {
      if (user && !familyGroupId) {
        const groupId = await getFamilyGroupId(user.id);
        setFamilyGroupId(groupId);
      }
    };
    initializeFamilyGroup();
  }, [user, familyGroupId]);

  const trackingInitialized = useRef(false);
  useEffect(() => {
    if (familyGroupId && !trackingInitialized.current) {
      trackingInitialized.current = true;
      startTracking({ highAccuracy: true, updateInterval: 10000 });
    }
  }, [familyGroupId]);

  const handleEmergencyTrigger = async () => {
    if (!requestDisclaimerAcceptance()) return;
    try {
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
      toast({ title: t('sos.activated'), description: t('sos.activatedDescription') });
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
      case 'contacts': navigate('/member-dashboard/emergency-contacts'); break;
      case 'settings': navigate('/member-dashboard/settings'); break;
    }
  };

  const currentLocation = getCurrentLocationData();

  // Build MapLibre entities from live data
  const mapEntities: MapEntity[] = React.useMemo(() => {
    const entities: MapEntity[] = [];

    if (currentLocation?.latitude && currentLocation?.longitude) {
      entities.push({
        id: 'current-user-location',
        type: 'member',
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        label: user?.user_metadata?.full_name || 'You',
        avatar_url: user?.user_metadata?.avatar_url,
        status: 'live',
        accuracy: currentLocation.accuracy,
        battery: emergencyStatus.battery,
      });
    }

    liveLocations.forEach(location => {
      if (location.user_id !== user?.id) {
        if (selectedFamilyMember && location.user_id !== selectedFamilyMember) return;
        entities.push({
          id: `live-${location.user_id}`,
          type: 'member',
          lat: location.latitude,
          lng: location.longitude,
          label: 'Family Member',
          status: getStatusFromPresence(undefined, false),
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          battery: location.battery_level,
        });
      }
    });

    return entities;
  }, [currentLocation?.latitude, currentLocation?.longitude, liveLocations, selectedFamilyMember, user?.id]);

  const mapCenter = React.useMemo(() => {
    if (selectedFamilyMember) {
      const familyLocation = liveLocations.find(l => l.user_id === selectedFamilyMember);
      if (familyLocation) return { lat: familyLocation.latitude, lng: familyLocation.longitude };
    }
    // TODO: The fallback to Spain (37.3881024, -2.1417503) should be replaced with user's actual location or a configurable default
    return currentLocation
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: 37.3881024, lng: -2.1417503 };
  }, [currentLocation, selectedFamilyMember, liveLocations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-orange-900">
      <SEO title={t('sos.seoTitle')} description={t('sos.seoDescription')} />

      {/* Header */}
      <div className="relative z-10 px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-white mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8" />
                <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full", getStatusColor(emergencyStatus.overall))}></div>
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('sos.title')}</h1>
                <p className="text-white/70 text-sm">{t('sos.commandCenter')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4" />
              <Battery className="h-4 w-4" />
              <span className="text-sm">{emergencyStatus.battery}%</span>
              {locationState.isTracking && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">{t('sos.live')}</span>
                </div>
              )}
            </div>
          </div>

          {/* System Status Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">{t('sos.systemStatus')}</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(emergencyStatus.overall)}
                <Button variant="ghost" size="sm" onClick={refreshLocation} className="text-white/70 hover:text-white h-8 w-8 p-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="h-4 w-4" />
                <span>{t('sos.location')}: {emergencyStatus.location ? t('sos.active') : t('sos.disabled')}</span>
                {locationState.isTracking && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse ml-1"></div>}
              </div>
              <div className="flex items-center gap-2 text-white/80"><Users className="h-4 w-4" /><span>{t('sos.contacts')}: {emergencyStatus.contacts}</span></div>
              <div className="flex items-center gap-2 text-white/80"><Wifi className="h-4 w-4" /><span>{t('sos.network')}: {emergencyStatus.network ? t('sos.connected') : t('sos.offline')}</span></div>
              <div className="flex items-center gap-2 text-white/80"><Battery className="h-4 w-4" /><span>{t('sos.battery')}: {emergencyStatus.battery}%</span></div>
            </div>
            {locationError && (
              <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-200 text-xs">{locationError}</div>
            )}
            {locationState.isTracking && metrics.totalUpdates > 0 && (
              <div className="mt-3 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>{t('sos.updates')}: {metrics.totalUpdates}</span>
                  <span>{t('sos.success')}: {metrics.successRate}%</span>
                  <span>{t('sos.avgAccuracy')}: &plusmn;{metrics.averageAccuracy}m</span>
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
                <span className="font-bold">{t('sos.activeEmergency')}</span>
                <Badge variant="destructive" className="bg-red-800">{activeIncident.status.toUpperCase()}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/90">
                <div>{t('sos.started')}: {activeIncident.startTime.toLocaleTimeString()}</div>
                <div>{t('sos.contacts')}: {activeIncident.contactsNotified} {t('sos.notified')}</div>
                <div>{t('sos.location')}: {activeIncident.locationShared ? t('sos.shared') : t('sos.pending')}</div>
                <div>{t('sos.family')}: {activeIncident.familyAlerted ? t('sos.alerted') : t('sos.pending')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-24">
        <div className="max-w-md mx-auto">
          {selectedTab === 'status' && (
            <div className="space-y-6">
              <div className="flex justify-center mb-8"><EmergencyButton /></div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Button className="h-16 bg-blue-600/20 border border-blue-500/30 text-white hover:bg-blue-600/30" onClick={() => toast({ title: t('sos.photoCapture'), description: t('sos.photoCaptureDescription') })}>
                  <div className="flex flex-col items-center gap-2"><Camera className="h-6 w-6" /><span className="text-sm">{t('sos.photo')}</span></div>
                </Button>
                <Button className="h-16 bg-purple-600/20 border border-purple-500/30 text-white hover:bg-purple-600/30" onClick={() => toast({ title: t('sos.voiceMemo'), description: t('sos.voiceMemoDescription') })}>
                  <div className="flex flex-col items-center gap-2"><Mic className="h-6 w-6" /><span className="text-sm">{t('sos.voice')}</span></div>
                </Button>
              </div>

              {/* Live Location Map - MapLibre */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-3 text-white">
                  <Navigation className="h-5 w-5" />
                  <span className="font-medium">{t('sos.liveLocation')}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {locationState.isTracking ? (
                      <><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-xs">{t('sos.live')} ({locationState.updateInterval / 1000}s)</span></>
                    ) : (
                      <><div className="w-2 h-2 bg-gray-500 rounded-full"></div><span className="text-xs">{t('sos.offline')}</span></>
                    )}
                  </div>
                </div>
                <div className="h-48 rounded-lg overflow-hidden">
                  <MapLibreMap
                    className="w-full h-full"
                    center={mapCenter}
                    zoom={selectedFamilyMember ? 15 : (currentLocation ? 16 : 10)}
                    interactive={true}
                  >
                    <MapMemberLayer members={mapEntities} />
                  </MapLibreMap>
                </div>
                <div className="mt-3 text-sm text-white/70 flex justify-between">
                  <span>{currentLocation ? `${t('sos.accuracy')}: \u00b1${currentLocation.accuracy || 5}m` : `${locationError || t('sos.gettingLocation')}`}</span>
                  <span>{currentLocation?.last_seen ? `${t('sos.updated')}: ${new Date(currentLocation.last_seen).toLocaleTimeString()}` : t('sos.waitingForGPS')}</span>
                </div>
                <div className="mt-3 p-2 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>{t('sos.familyConnected')}:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <span>{Math.max(1, Array.from(new Set(liveLocations.filter(l => l.status === 'online').map(l => l.user_id))).length)} {t('sos.membersOnline')}</span>
                    </div>
                  </div>
                  {locationState.isTracking && (
                    <div className="mt-1 text-xs text-white/60">{t('sos.highPrecisionMode')} &bull; {locationState.highAccuracyMode ? 'GPS' : t('sos.network')} {t('sos.tracking')}</div>
                  )}
                </div>
              </div>

              {contacts.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3 text-white">
                    <span className="font-medium">{t('sos.emergencyContacts')}</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">{contacts.length} {t('sos.active')}</Badge>
                  </div>
                  <div className="space-y-3">
                    {contacts.slice(0, 3).map((contact, index) => (
                      <div key={contact.id || index} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{contact.name}</div>
                          <div className="text-white/60 text-xs">{contact.relationship}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20"><PhoneCall className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20"><MessageSquare className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                    {contacts.length > 3 && (
                      <div className="text-center"><Button variant="ghost" className="text-white/70 hover:text-white text-sm">+{contacts.length - 3} {t('sos.moreContacts')}</Button></div>
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
                  <span className="font-medium">{t('sos.familyMembers')}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">{liveLocations.filter(l => l.user_id !== user?.id).length} {t('sos.online')}</Badge>
                </div>
                <div className="space-y-3">
                  {liveLocations.filter(l => l.user_id !== user?.id).map((location, index) => (
                    <div key={location.user_id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">{`M${index + 1}`}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{t('sos.familyMember')} {index + 1}</div>
                        <div className="text-white/60 text-xs">{location.status}</div>
                      </div>
                      <Button size="sm" onClick={() => { setSelectedFamilyMember(selectedFamilyMember === location.user_id ? null : location.user_id); setSelectedTab('status'); }}
                        className={cn("h-8 px-3 text-xs", selectedFamilyMember === location.user_id ? "bg-blue-600 text-white" : "bg-white/20 text-white hover:bg-white/30")}
                      >
                        {selectedFamilyMember === location.user_id ? t('sos.hide') : t('sos.showOnMap')}
                      </Button>
                    </div>
                  ))}
                  {liveLocations.filter(l => l.user_id !== user?.id).length === 0 && (
                    <div className="text-center text-white/60 py-4">{t('sos.noFamilyOnline')}</div>
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
            { id: 'status', icon: Shield, label: t('sos.tabStatus') },
            { id: 'family', icon: Users, label: t('sos.tabFamily') },
            { id: 'contacts', icon: Phone, label: t('sos.tabContacts') },
            { id: 'settings', icon: Settings, label: t('sos.tabSettings') },
          ].map((tab) => (
            <button key={tab.id} onClick={() => handleTabNavigation(tab.id)}
              className={cn("flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0", selectedTab === tab.id ? "text-white bg-white/20" : "text-white/60 hover:text-white/80")}
            >
              <tab.icon className="h-5 w-5 mb-1" /><span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <EmergencyDisclaimerModal isOpen={showDisclaimer} onAccept={handleDisclaimerAccept} onCancel={cancelDisclaimer} subscriptionTier="basic" />
    </div>
  );
};

export default SOSAppPage;
