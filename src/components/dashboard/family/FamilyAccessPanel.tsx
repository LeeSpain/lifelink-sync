import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Settings, Euro, Shield } from "lucide-react";
import FamilyInviteModal from "./FamilyInviteModal";

interface FamilyGroup {
  id: string;
  owner_seat_quota: number;
  created_at: string;
}

interface FamilyMembership {
  id: string;
  user_id: string;
  billing_type: 'owner' | 'self';
  status: 'active' | 'pending' | 'canceled';
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

interface FamilyInvite {
  id: string;
  name: string;
  email_or_phone: string;
  billing_type: 'owner' | 'self';
  expires_at: string;
  created_at: string;
}

const FamilyAccessPanel = () => {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [memberships, setMemberships] = useState<FamilyMembership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<FamilyInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { toast } = useToast();

  const loadFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get family group
      const { data: group, error: groupError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();

      if (groupError && groupError.code !== 'PGRST116') {
        console.error('Error loading family group:', groupError);
        return;
      }

      setFamilyGroup(group);

      if (group) {
        // Get family memberships
        const { data: members, error: membersError } = await supabase
          .from('family_memberships')
          .select('*')
          .eq('group_id', group.id);

        if (membersError) {
          console.error('Error loading family memberships:', membersError);
        } else {
          // Cast to proper types since we know the data structure
          setMemberships((members || []).map(m => ({
            ...m,
            billing_type: m.billing_type as 'owner' | 'self',
            status: m.status as 'active' | 'pending' | 'canceled'
          })));
        }

        // Get pending invites
        const { data: invites, error: invitesError } = await supabase
          .from('family_invites')
          .select('*')
          .eq('group_id', group.id)
          .gt('expires_at', new Date().toISOString());

        if (invitesError) {
          console.error('Error loading family invites:', invitesError);
        } else {
          // Map to expected interface structure
          setPendingInvites((invites || []).map(invite => ({
            id: invite.id,
            name: invite.name || invite.invitee_name || 'Unknown',
            email_or_phone: (invite as any).email_or_phone || (invite as any).invitee_email || '',
            billing_type: invite.billing_type as 'owner' | 'self',
            expires_at: invite.expires_at,
            created_at: invite.created_at
          })));
        }
      }

    } catch (error) {
      console.error('Error loading family data:', error);
      toast({
        title: "Error",
        description: "Failed to load family access data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyData();
    
    // Auto-refresh every 45 seconds
    const interval = setInterval(() => {
      loadFamilyData();
    }, 45000);

    // Listen for custom events from invite modal
    const handleInviteUpdate = () => {
      loadFamilyData();
    };
    
    window.addEventListener('family-invite-updated', handleInviteUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('family-invite-updated', handleInviteUpdate);
    };
  }, []);

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('family-invite-management', {
        body: {
          action: 'revoke',
          invite_id: inviteId
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Invite Revoked",
        description: "Family invite has been revoked successfully"
      });

      loadFamilyData();

    } catch (error) {
      console.error('Error revoking invite:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke invite",
        variant: "destructive"
      });
    }
  };

  const activeMembers = memberships.filter(m => m.status === 'active');
  const totalSeatsUsed = activeMembers.length + pendingInvites.length;
  const maxSeats = 5;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBillingBadge = (billingType: string) => {
    return billingType === 'owner' ? (
      <Badge variant="default" className="gap-1">
        <Euro className="h-3 w-3" />
        You pay
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Euro className="h-3 w-3" />
        They pay
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Family Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Family Access
              <Badge variant="secondary">{totalSeatsUsed}/{maxSeats} seats</Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              disabled={totalSeatsUsed >= maxSeats}
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite Family
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Privacy Features */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Privacy-First Design</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Location only during active SOS (no continuous tracking)</p>
                <p>• No device/battery telemetry shared with family</p>
                <p>• Live SOS map + "Received & On It" + incident summary</p>
              </div>
            </div>

            {/* Billing Summary */}
            {familyGroup && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Billing Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Owner-paid seats:</span>
                    <span>{familyGroup.owner_seat_quota} × €2.99/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invitee-paid seats:</span>
                    <span>{activeMembers.filter(m => m.billing_type === 'self').length} seats (billed separately)</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-medium">
                    <span>Your total:</span>
                    <span>€{(familyGroup.owner_seat_quota * 2.99).toFixed(2)}/month</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Members */}
            {activeMembers.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Active Family Members</h4>
                <div className="space-y-2">
                  {activeMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getBillingBadge(member.billing_type)}
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Pending Invites</h4>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50/50">
                      <div>
                        <p className="font-medium">{invite.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {invite.email_or_phone} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getBillingBadge(invite.billing_type)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvite(invite.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {totalSeatsUsed === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h4 className="font-medium mb-2">No Family Access Yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade emergency contacts to Family Access for €2.99/month to get live SOS alerts, maps, and "Received & On It."
                </p>
                <Button onClick={() => setIsInviteModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite First Family Member
                </Button>
              </div>
            )}

            {/* Upgrade CTA */}
            {totalSeatsUsed < maxSeats && totalSeatsUsed > 0 && (
              <div className="text-center p-4 bg-primary/5 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">
                  Upgrade to Family Access for €2.99/month to get alerts, a live SOS map, and "Received & On It."
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Family Member
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <FamilyInviteModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onInviteCreated={loadFamilyData}
      />
    </>
  );
};

export default FamilyAccessPanel;