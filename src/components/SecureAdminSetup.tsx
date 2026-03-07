import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SecureAdminSetup = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [canSetupAdmin, setCanSetupAdmin] = useState(false);
  const [hasExistingAdmin, setHasExistingAdmin] = useState(false);

  useEffect(() => {
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('secure-admin-setup', {
        method: 'GET'
      });

      if (error) {
        console.error('Error checking admin setup:', error);
        toast.error('Failed to check admin setup status');
        return;
      }

      setCanSetupAdmin(data.canSetupAdmin);
      setHasExistingAdmin(data.hasExistingAdmin);
    } catch (error) {
      console.error('Error checking admin setup:', error);
      toast.error('Failed to check admin setup status');
    } finally {
      setCheckingSetup(false);
    }
  };

  const setupAdmin = async () => {
    if (!user) {
      toast.error('You must be signed in to become admin');
      return;
    }

    // Verify email is confirmed before allowing admin setup
    if (!user.email_confirmed_at) {
      toast.error('Please verify your email address before setting up admin access');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-admin-setup', {
        method: 'POST'
      });

      if (error) {
        console.error('Error setting up admin:', error);
        toast.error('Failed to assign admin role');
        return;
      }

      if (data.success) {
        toast.success('Admin role assigned successfully!');
        // Refresh the page to update user role
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to assign admin role');
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast.error('Failed to assign admin role');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking admin setup status...</p>
        </div>
      </div>
    );
  }

  if (hasExistingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Admin Already Set Up</CardTitle>
            <CardDescription>
              An administrator account already exists for this system.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If you need admin access, please contact the existing administrator.
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>Secure Admin Setup</CardTitle>
          <CardDescription>
            Set up the first administrator account for this system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You must be signed in to set up admin access. Please sign in first.
                </AlertDescription>
              </Alert>
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">Go to Login</Link>
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> This will assign administrator privileges to your current account ({user.email}). 
                  This action can only be performed once when no admin exists.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={setupAdmin} 
                disabled={isLoading || !canSetupAdmin}
                className="w-full"
              >
                {isLoading ? 'Setting Up Admin...' : 'Become Administrator'}
              </Button>
              
              {!canSetupAdmin && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Admin setup is not available. An administrator may already exist.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
          
          <div className="text-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureAdminSetup;