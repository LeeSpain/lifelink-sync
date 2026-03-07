import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminSetup = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    try {
      // Use secure edge function to check admin setup status
      const { data, error } = await supabase.functions.invoke('secure-admin-setup', {
        method: 'GET'
      });

      if (error) {
        console.error('Error checking admin setup:', error);
        setIsSetup(true); // Default to setup complete on error
      } else {
        setIsSetup(data?.hasExistingAdmin || false);
      }
    } catch (error) {
      console.error('Error checking admin setup:', error);
      setIsSetup(true); // Default to setup complete on error
    } finally {
      setCheckingSetup(false);
    }
  };

  const setupAdmin = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Use secure edge function instead of direct database update
      const { data, error } = await supabase.functions.invoke('secure-admin-setup', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Admin role assigned successfully!');
      setIsSetup(true);
      
      // Refresh the page to update the user's access
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign admin role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking admin setup...</p>
        </div>
      </div>
    );
  }

  if (isSetup) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Admin Already Setup</CardTitle>
            <CardDescription>
              An admin user has already been configured for this system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                If you need admin access, please contact your system administrator.
              </AlertDescription>
            </Alert>
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
          <CardTitle>Initial Admin Setup</CardTitle>
          <CardDescription>
            No admin user exists yet. Set yourself as the first admin to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Only the first user should do this setup. 
              This will grant you full administrative access to the system.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={setupAdmin} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Become Admin'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;