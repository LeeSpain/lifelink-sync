import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, AlertTriangle, CheckCircle, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const FamilyDashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useOptimizedAuth();
  const { data: familyRole } = useFamilyRole();
  const { toast } = useToast();
  
  const [activeSOSEvents, setActiveSOSEvents] = useState<any[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [familyGroup, setFamilyGroup] = useState<any>(null);
  const [familyMembership, setFamilyMembership] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (familyRole?.familyGroupId) {
      loadDashboardData();
    } else if (familyRole && familyRole.role === 'none') {
      // User is authenticated but has no family role - show empty state
      setIsLoading(false);
    } else if (familyRole && !familyRole.familyGroupId) {
      // Handle cases where family role exists but no group ID
      setIsLoading(false);
    }
  }, [familyRole]);

  const loadDashboardData = async () => {
    if (!familyRole?.familyGroupId) return;

    try {
      // Load family group data
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
        
        // Load owner profile separately
        if (groupData.owner_user_id) {
          const { data: ownerData, error: ownerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', groupData.owner_user_id)
            .single();

          if (ownerError) {
            console.error('Error loading owner profile:', ownerError);
          } else {
            setOwnerProfile(ownerData);
          }
        }
      }

      // Load active SOS events for the family group
      const { data: sosEvents } = await supabase
        .from('sos_events')
        .select('*')
        .eq('group_id', familyRole.familyGroupId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setActiveSOSEvents(sosEvents || []);

      // Load family membership details
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
        title: "Error",
        description: "Failed to load family emergency information",
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
        title: "Response Sent",
        description: "Your family has been notified that you received the alert and are on your way."
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show empty state if user has no family role or access
  if (familyRole && (familyRole.role === 'none' || !familyRole.familyGroupId)) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Family Access</h3>
            <p className="text-muted-foreground mb-4">
              You don't have access to any family emergency systems yet. Contact the emergency plan owner to get invited.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Main Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={ownerProfile?.avatar_url} />
              <AvatarFallback>
                {ownerProfile?.first_name?.[0]}{ownerProfile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">
                Connected to {ownerProfile?.first_name || 'Family Owner'}
              </h1>
              <p className="text-muted-foreground">
                {familyRole?.role === 'owner' 
                  ? 'You manage this family emergency system'
                  : `Family emergency monitoring access`
                }
              </p>
            </div>
            <Badge variant="outline">
              {familyRole?.role === 'owner' ? 'Owner' : 'Family Member'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Active Emergency Alert */}
      {activeSOSEvents.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Alert Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSOSEvents.map((event) => (
              <div key={event.id} className="space-y-4">
                <div>
                  <p className="font-medium">Emergency SOS triggered by {ownerProfile?.first_name}</p>
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
                    Acknowledge & Respond
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/family-dashboard/live-map?event=${event.id}`, '_blank')}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View Location
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Safe Status */}
      {activeSOSEvents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">All Safe</h3>
              <p className="text-sm text-muted-foreground">
                No active emergency alerts • Family network connected
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connected to:</span>
              <Badge variant="default">
                {ownerProfile ? `${ownerProfile.first_name} ${ownerProfile.last_name}` : 'Loading...'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Your Role:</span>
              <Badge variant="outline">
                {familyMembership?.relationship || familyRole?.role === 'owner' ? 'Owner' : 'Family Member'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Emergency Alerts:</span>
              <Badge variant="outline" className="text-primary">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Access Level:</span>
              <Badge variant="outline" className="text-primary">
                {familyRole?.role === 'owner' ? 'Full Control' : 'Emergency Monitor'}
              </Badge>
            </div>
            {familyMembership && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Connected Since:</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(familyMembership.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => navigate('/family-dashboard/live-map')}
            >
              <div className="text-left">
                <div className="font-medium">Live Family Map</div>
                <div className="text-sm text-muted-foreground">View real-time locations</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => navigate('/family-dashboard/emergency-map')}
            >
              <div className="text-left">
                <div className="font-medium">Emergency Center</div>
                <div className="text-sm text-muted-foreground">Emergency protocols & contacts</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyDashboardHome;