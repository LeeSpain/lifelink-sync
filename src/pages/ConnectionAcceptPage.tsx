import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Shield, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ConnectionAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');

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
        setError('Invalid or expired invitation');
      }
    } catch (error) {
      console.error('Error checking invitation:', error);
      setError('Failed to load invitation');
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
        body: { token },
        method: 'POST'
      });

      if (error) throw error;

      toast({
        title: "Invitation accepted!",
        description: `You've successfully joined as a ${data.connection.type.replace('_', ' ')}.`,
      });

      // Redirect based on connection type
      navigate(data.redirect_url || '/dashboard');
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
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
            <p className="text-muted-foreground">Loading invitation...</p>
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
            <h3 className="text-lg font-semibold mb-2">Invalid Invitation</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
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
      ? 'Family Circle Invitation' 
      : 'Trusted Contact Invitation';
  };

  const getDescription = () => {
    return invitation?.connection.type === 'family_circle'
      ? 'You\'ve been invited to join a family circle with full access to emergency dashboard and history.'
      : 'You\'ve been invited as a trusted contact to receive notifications during emergency situations only.';
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
              <p className="text-sm font-medium">Invited as:</p>
              <p className="text-sm text-muted-foreground">
                {invitation?.connection.relationship || 'Family member'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email:</p>
              <p className="text-sm text-muted-foreground">
                {invitation?.connection.invite_email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Invited on:</p>
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
                ? 'As a family member, you\'ll have access to the full emergency dashboard, location history, and real-time updates.'
                : 'As a trusted contact, you\'ll receive notifications and temporary access during active emergency situations only.'
              }
            </AlertDescription>
          </Alert>

          {/* Auth Required Notice */}
          {!user && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in or create an account to accept this invitation.
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
                Accepting...
              </>
            ) : user ? (
              'Accept Invitation'
            ) : (
              'Sign In to Accept'
            )}
          </Button>

          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="w-full"
          >
            Decline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};