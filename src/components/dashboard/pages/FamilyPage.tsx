import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Shield, MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function FamilyPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    relationship: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFamilyData();
  }, []);

  const loadFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load family invites
      const { data: invites, error: inviteError } = await supabase
        .from('family_invites')
        .select('*')
        .eq('inviter_user_id', user.id)
        .order('created_at', { ascending: false });

      if (inviteError) throw inviteError;

      const acceptedMembers = invites?.filter(invite => invite.status === 'accepted') || [];
      const pendingInvitesList = invites?.filter(invite => invite.status === 'pending') || [];

      setFamilyMembers(acceptedMembers);
      setPendingInvites(pendingInvitesList);
    } catch (error) {
      console.error('Error loading family data:', error);
      toast({
        title: "Error",
        description: "Failed to load family data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteData.name || !inviteData.email || !inviteData.relationship) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for inviter email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const inviterName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Family Member';

      const { error } = await supabase.functions.invoke('family-invites', {
        body: {
          invitee_name: inviteData.name,
          invitee_email: inviteData.email,
          relationship: inviteData.relationship,
          inviter_email: user.email,
          inviter_name: inviterName
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Family invitation sent to ${inviteData.name} successfully.`
      });

      setShowInviteForm(false);
      setInviteData({ name: "", email: "", relationship: "" });
      loadFamilyData();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send family invitation.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Family
              </CardTitle>
              <Button onClick={() => setShowInviteForm(true)} variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Invite Family Member
              </Button>
            </div>
            <CardDescription>
              Manage your family members and monitor their safety
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Invite Form */}
        {showInviteForm && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Family Member</CardTitle>
              <CardDescription>
                Send an invitation to a family member to join your safety network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={inviteData.relationship}
                  onChange={(e) => setInviteData({...inviteData, relationship: e.target.value})}
                  placeholder="e.g., Spouse, Child, Parent, Sibling"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInvite}>Send Invitation</Button>
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members ({familyMembers.length})
            </CardTitle>
            <CardDescription>
              Monitor the safety status and location of your family members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Accepted Family Members */}
              {familyMembers.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-base">Connected Family Members</h4>
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {member.invitee_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{member.invitee_name}</h3>
                          <p className="text-sm text-muted-foreground">{member.relationship}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            {member.invitee_email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(member.accepted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-base">Pending Invitations</h4>
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {invite.invitee_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{invite.invitee_name}</h3>
                          <p className="text-sm text-muted-foreground">{invite.relationship}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            {invite.invitee_email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent: {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {familyMembers.length === 0 && pendingInvites.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No family members yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your safety network by inviting family members
                  </p>
                  <Button onClick={() => setShowInviteForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Your First Family Member
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading family members...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}