import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Shield, Check, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ConnectionAcceptPage = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [shareMyLocation, setShareMyLocation] = useState(true);

  useEffect(() => {
    if (token) {
      checkInvitation();
    }
  }, [token, user]);

  const checkInvitation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('connections-accept', {
        body: { token },
      });

      if (error) throw error;

      if (data.valid) {
        setInvitation(data);
      } else {
        setError(t('family.invalidInvitation'));
      }
    } catch (error) {
      console.error('Error checking invitation:', error);
      setError(t('family.failedToLoadInvite'));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to auth with return URL
      navigate(`/auth?return=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      setAccepting(true);
      const { data, error } = await supabase.functions.invoke('connections-accept', {
        body: { token, contact_share_location: shareMyLocation },
        method: 'POST'
      });

      if (error) throw error;

      toast({
        title: t('family.invitationAcceptedTitle'),
        description: t('family.invitationAcceptedDescription', { type: data.connection.type.replace('_', ' ') }),
      });

      // Redirect based on connection type
      navigate(data.redirect_url || '/dashboard');
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: t('family.errorTitle'),
        description: t('family.failedToAcceptInvitation'),
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t('family.loadingInvitation')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('family.invalidInvitation')}</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              {t('family.goToHomepage')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getIcon = () => {
    return invitation?.connection.type === 'family_circle' ? (
      <Crown className="h-12 w-12 text-primary" />
    ) : (
      <Shield className="h-12 w-12 text-secondary" />
    );
  };

  const getTitle = () => {
    return invitation?.connection.type === 'family_circle'
      ? t('family.familyCircleInvitation')
      : t('family.trustedContactInvitation');
  };

  const getDescription = () => {
    return invitation?.connection.type === 'family_circle'
      ? t('family.familyCircleDescription')
      : t('family.trustedContactDescription');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getIcon()}
          </div>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invitation Details */}
          <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
            <div>
              <p className="text-sm font-medium">{t('family.invitedAs')}</p>
              <p className="text-sm text-muted-foreground">
                {invitation?.connection.relationship || t('family.familyMember')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('family.email')}</p>
              <p className="text-sm text-muted-foreground">
                {invitation?.connection.invite_email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('family.invitedOn')}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(invitation?.connection.invited_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Access Information */}
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              {invitation?.connection.type === 'family_circle'
                ? t('family.familyCircleAccess')
                : t('family.trustedContactAccess')
              }
            </AlertDescription>
          </Alert>

          {/* Location Sharing Choice */}
          {invitation?.connection.type === 'family_circle' && (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
              <Label className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                {t('family.locationSharingTitle')}
              </Label>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t('family.shareMyLocation')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('family.shareMyLocationDescription')}
                  </p>
                </div>
                <Switch
                  checked={shareMyLocation}
                  onCheckedChange={setShareMyLocation}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('family.locationSharingNote')}
              </p>
            </div>
          )}

          {/* Auth Required Notice */}
          {!user && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('family.signInRequired')}
              </AlertDescription>
            </Alert>
          )}

          {/* Accept Button */}
          <Button 
            onClick={handleAccept} 
            disabled={accepting}
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('family.accepting')}
              </>
            ) : user ? (
              t('family.acceptInvitation')
            ) : (
              t('family.signInToAccept')
            )}
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            {t('family.decline')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};