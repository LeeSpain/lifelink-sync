import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

interface FamilyInvite {
  id: string;
  invitee_email: string;
  invitee_name: string;
  inviter_email: string;
  relationship: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const FamilyInviteAccept = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [invite, setInvite] = useState<FamilyInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvite();
    }
  }, [token]);

  const loadInvite = async () => {
    try {
      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError(t('family.inviteNotFound'));
        return;
      }

      if (data.status !== 'pending') {
        setError(t('family.alreadyProcessed'));
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError(t('family.inviteExpired'));
        return;
      }

      setInvite(data);
    } catch (error) {
      console.error('Error loading invite:', error);
      setError(t('family.failedToLoadInvite'));
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!invite || !user) return;

    setAccepting(true);
    try {
      const { error } = await supabase.functions.invoke('family-invite-management', {
        body: {
          action: 'accept',
          invite_id: invite.id,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: t('family.successTitle'),
        description: t('family.joinedFamilyGroup'),
      });

      navigate('/family-app');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: t('family.errorTitle'),
        description: t('family.failedToAccept'),
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  const declineInvite = async () => {
    if (!invite) return;

    try {
      const { error } = await supabase.functions.invoke('family-invite-management', {
        body: {
          action: 'decline',
          invite_id: invite.id
        }
      });

      if (error) throw error;

      toast({
        title: t('family.invitationDeclinedTitle'),
        description: t('family.invitationDeclinedDescription'),
      });

      navigate('/');
    } catch (error) {
      console.error('Error declining invite:', error);
      toast({
        title: t('family.errorTitle'),
        description: t('family.failedToDecline'),
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={t('family.invitationErrorSeoTitle')}
          description={t('family.invitationErrorSeoDescription')}
        />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">{t('family.invitationError')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => navigate('/')}>
                  {t('family.returnHome')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('family.familyInvitation')}
        description={t('family.familyInvitationSeoDescription')}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('family.familyInvitation')}</CardTitle>
              <p className="text-muted-foreground">
                {t('family.invitedToJoin')}
              </p>
            </CardHeader>
            
            <CardContent className="p-8 space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('family.invitedBy')}</span>
                  <span>{invite.inviter_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('family.yourName')}</span>
                  <span>{invite.invitee_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('family.relationship')}</span>
                  <Badge variant="outline">{invite.relationship}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('family.invitedOn')}</span>
                  <span>{new Date(invite.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('family.whatYouGetAccess')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">{t('family.emergencyAlertsTitle')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('family.emergencyAlertsDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">{t('family.familyDashboardTitle')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('family.familyDashboardDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!user ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    {t('family.signInRequired')}
                  </p>
                  <Button
                    className="mt-3"
                    onClick={() => navigate('/auth', { state: { returnTo: `/family-invite/${token}` } })}
                  >
                    {t('family.signInCreateAccount')}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={acceptInvite} 
                    disabled={accepting}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {accepting ? t('family.joining') : t('family.acceptInvitation')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={declineInvite}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('family.decline')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FamilyInviteAccept;