import React, { useState, useEffect } from 'react';
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
        setError('Invite not found');
        return;
      }

      if (data.status !== 'pending') {
        setError('This invitation has already been processed');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvite(data);
    } catch (error) {
      console.error('Error loading invite:', error);
      setError('Failed to load invitation');
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
        title: "Success",
        description: "You've successfully joined the family group!",
      });

      navigate('/family-dashboard');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
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
        title: "Invitation Declined",
        description: "You've declined the family invitation.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error declining invite:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
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
          title="Family Invitation Error"
          description="There was an issue with your family invitation."
        />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Invitation Error</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => navigate('/')}>
                  Return Home
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
        title="Family Invitation"
        description="You've been invited to join a family emergency protection group."
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Family Invitation</CardTitle>
              <p className="text-muted-foreground">
                You've been invited to join a family emergency protection group
              </p>
            </CardHeader>
            
            <CardContent className="p-8 space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Invited by:</span>
                  <span>{invite.inviter_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Your name:</span>
                  <span>{invite.invitee_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Relationship:</span>
                  <Badge variant="outline">{invite.relationship}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Invited on:</span>
                  <span>{new Date(invite.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What you'll get access to:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Emergency Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive instant notifications during family emergencies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Family Dashboard</h4>
                      <p className="text-sm text-muted-foreground">
                        Access shared family emergency information
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!user ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    You need to sign in or create an account to accept this invitation.
                  </p>
                  <Button 
                    className="mt-3" 
                    onClick={() => navigate('/auth', { state: { returnTo: `/family-invite/${token}` } })}
                  >
                    Sign In / Create Account
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
                    {accepting ? 'Joining...' : 'Accept Invitation'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={declineInvite}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
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