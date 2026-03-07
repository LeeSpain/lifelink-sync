import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, AlertTriangle, CheckCircle, MapPin, Clock, Map, Bell, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';

const FamilyDashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useOptimizedAuth();
  const { data: familyRole } = useFamilyRole();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [activeSOSEvents, setActiveSOSEvents] = useState<any[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [familyGroup, setFamilyGroup] = useState<any>(null);
  const [familyMembership, setFamilyMembership] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (familyRole?.familyGroupId) {
      loadDashboardData();
    } else if (familyRole && familyRole.role === 'none') {
      setIsLoading(false);
    } else if (familyRole && !familyRole.familyGroupId) {
      setIsLoading(false);
    }
  }, [familyRole]);

  const loadDashboardData = async () => {
    if (!familyRole?.familyGroupId) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', familyRole.familyGroupId)
        .single();

      if (groupError) {
        console.error('Error loading family group:', groupError);
        throw groupError;
      }

      if (groupData) {
        setFamilyGroup(groupData);

        if (groupData.owner_user_id) {
          const { data: ownerData, error: ownerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', groupData.owner_user_id)
            .single();

          if (!ownerError) {
            setOwnerProfile(ownerData);
          }
        }
      }

      const { data: sosEvents } = await supabase
        .from('sos_events')
        .select('*')
        .eq('group_id', familyRole.familyGroupId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setActiveSOSEvents(sosEvents || []);

      if (user) {
        const { data: membership } = await supabase
          .from('family_memberships')
          .select('*')
          .eq('user_id', user.id)
          .eq('group_id', familyRole.familyGroupId)
          .single();

        setFamilyMembership(membership);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: t('familyDashboard.error'),
        description: t('familyDashboard.loadError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSOSAcknowledge = async (eventId: string) => {
    try {
      const { error } = await supabase.functions.invoke('family-sos-acknowledge', {
        body: {
          event_id: eventId,
          response_type: 'received_and_on_it'
        }
      });

      if (error) throw error;

      toast({
        title: t('familyDashboard.responseSent'),
        description: t('familyDashboard.responseSentDesc')
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      toast({
        title: t('familyDashboard.error'),
        description: t('familyDashboard.responseError'),
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{t('familyDashboard.loadingDashboard')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (familyRole && (familyRole.role === 'none' || !familyRole.familyGroupId)) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('familyDashboard.noFamilyAccess')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('familyDashboard.noAccessDesc')}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/member-dashboard')}
            >
              {t('familyDashboard.goToMainDashboard')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('familyDashboard.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('familyDashboard.subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="h-7">
          {familyRole?.role === 'owner' ? t('familyDashboard.owner') : t('familyDashboard.familyMember')}
        </Badge>
      </div>

      {/* Connection Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={ownerProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {ownerProfile?.first_name?.[0]}{ownerProfile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {t('familyDashboard.connectedTo', { name: ownerProfile?.first_name || t('familyDashboard.familyMember') })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {familyRole?.role === 'owner'
                  ? t('familyDashboard.manageSystem')
                  : t('familyDashboard.monitoringAccess')
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Emergency Alert */}
      {activeSOSEvents.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('familyDashboard.emergencyAlertActive')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSOSEvents.map((event) => (
              <div key={event.id} className="space-y-4">
                <div>
                  <p className="font-medium">{t('familyDashboard.sosTriggeredBy', { name: ownerProfile?.first_name })}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                    {event.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSOSAcknowledge(event.id)}
                    variant="destructive"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('familyDashboard.acknowledgeRespond')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/family-dashboard/live-map?event=${event.id}`)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('familyDashboard.viewLocation')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Safe Status */}
      {activeSOSEvents.length === 0 && (
        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('familyDashboard.allSafe')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('familyDashboard.noActiveAlerts')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Details & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              {t('familyDashboard.connectionDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg border">
              <span className="text-sm">{t('familyDashboard.connectedToLabel')}</span>
              <span className="text-sm font-medium">
                {ownerProfile ? `${ownerProfile.first_name} ${ownerProfile.last_name}` : t('familyDashboard.loading')}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border">
              <span className="text-sm">{t('familyDashboard.yourRole')}</span>
              <Badge variant="outline" className="text-xs">
                {familyRole?.role === 'owner' ? t('familyDashboard.owner') : t('familyDashboard.familyMember')}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border">
              <span className="text-sm">{t('familyDashboard.emergencyAlerts')}</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm font-medium text-green-600">{t('familyDashboard.enabled')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border">
              <span className="text-sm">{t('familyDashboard.accessLevel')}</span>
              <Badge variant="secondary" className="text-xs">
                {familyRole?.role === 'owner' ? t('familyDashboard.fullControl') : t('familyDashboard.emergencyMonitor')}
              </Badge>
            </div>
            {familyMembership && (
              <div className="flex items-center justify-between p-2.5 rounded-lg border">
                <span className="text-sm">{t('familyDashboard.connectedSince')}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(familyMembership.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('familyDashboard.quickAccess')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4 group"
              onClick={() => navigate('/family-dashboard/live-map')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Map className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{t('familyDashboard.liveFamilyMap')}</div>
                  <div className="text-xs text-muted-foreground">{t('familyDashboard.viewRealTimeLocations')}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4 group"
              onClick={() => navigate('/family-dashboard/emergency-map')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{t('familyDashboard.emergencyCenter')}</div>
                  <div className="text-xs text-muted-foreground">{t('familyDashboard.emergencyProtocols')}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-auto p-4 group"
              onClick={() => navigate('/family-dashboard/notifications')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{t('familyDashboard.notifications')}</div>
                  <div className="text-xs text-muted-foreground">{t('familyDashboard.viewAlertsUpdates')}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FamilyDashboardHome;
