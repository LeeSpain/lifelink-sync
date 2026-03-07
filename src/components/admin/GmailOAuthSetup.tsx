import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GmailToken {
  id: string;
  user_id: string;
  email_address: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  last_refreshed_at: string;
  refresh_count: number;
  scope: string;
  created_at: string;
  updated_at: string;
}

export const GmailOAuthSetup: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [gmailToken, setGmailToken] = useState<GmailToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailConnection();
  }, []);

  const checkGmailConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('gmail_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Gmail connection:', error);
      } else if (data) {
        setGmailToken(data);
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateGmailOAuth = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'authorize' }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open OAuth URL in a new window
        const authWindow = window.open(
          data.authUrl,
          'gmail-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the window to close or receive a message
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            // Check if authorization was successful
            setTimeout(() => {
              checkGmailConnection();
            }, 1000);
          }
        }, 1000);

        // Listen for OAuth callback messages
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'gmail-oauth-code') {
            // Exchange code for tokens
            try {
              const { data: tokenData, error: tokenError } = await supabase.functions.invoke('gmail-oauth', {
                body: { 
                  action: 'callback',
                  code: event.data.code,
                  state: event.data.state
                }
              });

              if (tokenError) throw tokenError;

              toast({
                title: "Gmail Connected",
                description: "Successfully connected your Gmail account!",
              });
            } catch (error) {
              console.error('Token exchange error:', error);
              toast({
                title: "Connection Failed",
                description: "Failed to exchange authorization code",
                variant: "destructive"
              });
            }
          } else if (event.data?.type === 'gmail-oauth-success') {
            clearInterval(checkClosed);
            authWindow?.close();
            setIsConnecting(false);
            checkGmailConnection();
          } else if (event.data?.type === 'gmail-oauth-error') {
            clearInterval(checkClosed);
            authWindow?.close();
            setIsConnecting(false);
            toast({
              title: "Connection Failed",
              description: event.data.error || "Failed to connect Gmail account",
              variant: "destructive"
            });
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      console.error('Error initiating Gmail OAuth:', error);
      setIsConnecting(false);
      toast({
        title: "OAuth Error",
        description: "Failed to start Gmail authorization process",
        variant: "destructive"
      });
    }
  };

  const refreshGmailToken = async () => {
    if (!gmailToken) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'refresh' }
      });

      if (error) throw error;

      toast({
        title: "Token Refreshed",
        description: "Gmail access token has been refreshed successfully",
      });
      
      await checkGmailConnection();
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh Gmail token",
        variant: "destructive"
      });
    }
  };

  const revokeGmailAccess = async () => {
    try {
      const { error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'revoke' }
      });

      if (error) throw error;

      setGmailToken(null);
      toast({
        title: "Access Revoked",
        description: "Gmail access has been revoked successfully",
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Revoke Failed", 
        description: "Failed to revoke Gmail access",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
          {gmailToken && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!gmailToken ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Gmail account to enable automated email sending through the marketing workflow.
                Your email credentials are securely stored and encrypted.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">What you'll get:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Send marketing emails directly from your Gmail account</li>
                <li>• Personalized email campaigns with AI-generated content</li>
                <li>• Automated follow-up sequences</li>
                <li>• Full email response management</li>
              </ul>
            </div>

            <Button 
              onClick={initiateGmailOAuth}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting to Gmail...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail Account
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Gmail account <strong>{gmailToken.email_address}</strong> is connected and ready for automated email sending.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium">Connected Email:</label>
                <p className="text-muted-foreground">{gmailToken.email_address}</p>
              </div>
              <div>
                <label className="font-medium">Connected:</label>
                <p className="text-muted-foreground">
                  {new Date(gmailToken.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="font-medium">Token Expires:</label>
                <p className="text-muted-foreground">
                  {new Date(gmailToken.expires_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="font-medium">Last Refreshed:</label>
                <p className="text-muted-foreground">
                  {gmailToken.last_refreshed_at 
                    ? new Date(gmailToken.last_refreshed_at).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshGmailToken}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Token
              </Button>
              <Button variant="outline" size="sm" onClick={revokeGmailAccess}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Revoke Access
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};