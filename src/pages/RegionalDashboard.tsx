import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegionalRole } from '@/hooks/useRegionalRole';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Phone, Settings } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { RegionalClientsPanel } from '@/components/regional/RegionalClientsPanel';
import { ActiveSOSPanel } from '@/components/regional/ActiveSOSPanel';
import { QuickNotificationsPanel } from '@/components/regional/QuickNotificationsPanel';

const RegionalDashboard = () => {
  const { t } = useTranslation();
  const { data: regionalRole } = useRegionalRole();
  const { isAdmin } = useOptimizedAuth();
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [clients, setClients] = useState([]);

  // Fetch regional clients and SOS events with real-time updates
  const { data: clientsData = [], refetch: refetchClients } = useQuery({
    queryKey: ['regional-clients', regionalRole?.organizationId],
    queryFn: async () => {
      if (!regionalRole?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', regionalRole.organizationId)
        .eq('subscription_regional', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!regionalRole?.organizationId,
    staleTime: 30000,
  });

  const { data: eventsData = [], refetch: refetchEvents } = useQuery({
    queryKey: ['regional-sos-events', regionalRole?.organizationId],
    queryFn: async () => {
      if (!regionalRole?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('regional_sos_events')
        .select('*')
        .eq('organization_id', regionalRole.organizationId)
        .order('triggered_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!regionalRole?.organizationId,
    staleTime: 10000,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!regionalRole?.organizationId) return;

    const eventsChannel = supabase
      .channel('regional-sos-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'regional_sos_events',
          filter: `organization_id=eq.${regionalRole.organizationId}`
        },
        () => {
          refetchEvents();
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('family-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_notifications'
        },
        () => {
          refetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [regionalRole?.organizationId, refetchEvents]);

  useEffect(() => {
    setClients(clientsData);
    setActiveEvents(eventsData);
  }, [clientsData, eventsData]);

  // Check if user has regional access (including platform admins)
  const hasRegionalAccess = isAdmin || 
                           regionalRole?.isRegionalOperator || 
                           regionalRole?.isRegionalSupervisor || 
                           regionalRole?.isPlatformAdmin;

  // Show loading or access denied if not authorized
  if (!hasRegionalAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('regionalDashboard.accessRestricted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {t('regionalDashboard.noPermission')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Language Selector */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('regionalDashboard.title')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('regionalDashboard.subtitle')} - {regionalRole?.organizationName || t('regionalDashboard.platformAdmin')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector compact />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    {t('regionalDashboard.activeCustomers')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <p className="text-sm text-gray-600">{t('regionalDashboard.connectedCustomers')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    {t('regionalDashboard.openAlerts')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeEvents.filter(e => e.status === 'open').length}</div>
                  <p className="text-sm text-gray-600">{t('regionalDashboard.pendingEvents')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    {t('regionalDashboard.systemStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {t('regionalDashboard.operational')}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">{t('regionalDashboard.allSystemsFunctioning')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Regional Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <RegionalClientsPanel 
                    clients={clients}
                    selectedClient={selectedClient}
                    onSelectClient={setSelectedClient}
                    organizationId={regionalRole?.organizationId}
                  />
                </CardContent>
              </Card>

              {/* Active SOS Panel */}
              {selectedClient && (
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActiveSOSPanel 
                      client={selectedClient}
                      events={activeEvents}
                      organizationId={regionalRole?.organizationId}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Side Panel - Quick Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickNotificationsPanel 
                  selectedClient={selectedClient}
                  organizationId={regionalRole?.organizationId}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('regionalDashboard.systemInformation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">{t('regionalDashboard.organization')}</h4>
                  <p className="text-gray-600">{regionalRole?.organizationName || t('regionalDashboard.notAssigned')}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t('regionalDashboard.role')}</h4>
                  <Badge variant="outline">
                    {isAdmin ? t('regionalDashboard.platformAdmin') :
                     regionalRole?.isRegionalSupervisor ? t('regionalDashboard.regionalSupervisor') : 
                     regionalRole?.isRegionalOperator ? t('regionalDashboard.regionalOperator') : 
                     regionalRole?.isPlatformAdmin ? t('regionalDashboard.platformAdmin') :
                     t('regionalDashboard.user')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegionalDashboard;