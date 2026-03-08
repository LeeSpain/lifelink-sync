import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Phone, Mail, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SOSEvent {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  address?: string;
  lat?: number;
  lng?: number;
  notes?: string;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

const TrustedContactView = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const { toast } = useToast();
  const [sosEvent, setSOSEvent] = useState<SOSEvent | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      // Load SOS event
      const { data: eventData, error: eventError } = await supabase
        .from('sos_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setSOSEvent(eventData);

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('user_id', eventData.user_id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

    } catch (error) {
      console.error('Error loading event data:', error);
      toast({
        title: t('family.loadErrorTitle'),
        description: t('family.loadErrorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      const { error } = await supabase.functions.invoke('family-sos-acknowledge', {
        body: {
          event_id: eventId,
          response_type: 'trusted_contact_acknowledged'
        }
      });

      if (error) throw error;

      setHasAcknowledged(true);
      toast({
        title: t('family.acknowledgmentSentTitle'),
        description: t('family.acknowledgmentSentDescription')
      });

    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      toast({
        title: t('family.acknowledgmentErrorTitle'),
        description: t('family.acknowledgmentErrorDescription'),
        variant: "destructive"
      });
    }
  };

  const handleCallUser = () => {
    if (userProfile?.phone) {
      window.location.href = `tel:${userProfile.phone}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t('family.loadingEmergencyInfo')}</p>
        </div>
      </div>
    );
  }

  if (!sosEvent) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">{t('family.emergencyAlertNotFound')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {t('family.emergencyAlertNotFoundDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-destructive">{t('family.emergencyAlert')}</CardTitle>
            <p className="text-muted-foreground">
              {t('family.triggeredSOS', { name: `${userProfile?.first_name} ${userProfile?.last_name}` })}
            </p>
          </CardHeader>
        </Card>

        {/* Emergency Details */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('family.emergencyInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('family.timeTriggered')}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(sosEvent.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {sosEvent.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('family.location')}</p>
                    <p className="text-sm text-muted-foreground">{sosEvent.address}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('family.status')}</p>
                  <Badge variant={sosEvent.status === 'active' ? 'destructive' : 'secondary'}>
                    {sosEvent.status}
                  </Badge>
                </div>
              </div>
            </div>

            {sosEvent.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">{t('family.additionalInformation')}</p>
                <p className="text-sm text-muted-foreground">{sosEvent.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-medium mb-2">{t('family.howToRespond')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('family.chooseAction', { name: userProfile?.first_name })}
                </p>
              </div>

              <div className="grid gap-3">
                {!hasAcknowledged ? (
                  <Button 
                    onClick={handleAcknowledge}
                    className="w-full h-12"
                    variant="destructive"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('family.acknowledgeEmergency')}
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">{t('family.responseSent')}</p>
                    <p className="text-green-700 text-sm">
                      {t('family.responseSentDescription', { name: userProfile?.first_name })}
                    </p>
                  </div>
                )}

                {userProfile?.phone && (
                  <Button 
                    onClick={handleCallUser}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {t('family.callNow', { name: userProfile.first_name })}
                  </Button>
                )}

                {sosEvent.lat && sosEvent.lng && (
                  <Button 
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${sosEvent.lat},${sosEvent.lng}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('family.viewLocationOnMap')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium">{t('family.emergencyResponseInstructions')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('family.emergencyResponseDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrustedContactView;