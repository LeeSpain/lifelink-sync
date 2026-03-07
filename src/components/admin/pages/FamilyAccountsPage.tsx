import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Heart, Users, Mail, Phone, Calendar, Plus, Send, UserPlus, Settings } from 'lucide-react';

interface FamilyMember {
  id: string;
  inviter_user_id: string;
  invitee_name: string;
  invitee_email: string;
  inviter_email: string;
  relationship: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
}

interface FamilyGroup {
  inviter_email: string;
  inviter_name: string;
  members: FamilyMember[];
  total_members: number;
  pending_invites: number;
  accepted_members: number;
}

export default function FamilyAccountsPage() {
  const [familyInvites, setFamilyInvites] = useState<FamilyMember[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<FamilyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();

  const [inviteForm, setInviteForm] = useState({
    inviter_email: '',
    invitee_name: '',
    invitee_email: '',
    relationship: 'Family Member'
  });

  useEffect(() => {
    loadFamilyData();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [searchTerm, statusFilter, familyGroups]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      
      const { data: invitesData, error } = await supabase
        .from('family_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading family invites:', error);
        return;
      }

      setFamilyInvites(invitesData || []);
      
      // Group by inviter to create family groups
      const groups = groupInvitesByFamily(invitesData || []);
      setFamilyGroups(groups);
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupInvitesByFamily = (invites: FamilyMember[]): FamilyGroup[] => {
    const groupMap: { [key: string]: FamilyGroup } = {};

    invites.forEach(invite => {
      const key = invite.inviter_user_id;
      
      if (!groupMap[key]) {
        groupMap[key] = {
          inviter_email: invite.inviter_email,
          inviter_name: invite.inviter_email.split('@')[0], // Simple name extraction
          members: [],
          total_members: 0,
          pending_invites: 0,
          accepted_members: 0
        };
      }

      groupMap[key].members.push(invite);
      groupMap[key].total_members++;
      
      if (invite.status === 'pending') {
        groupMap[key].pending_invites++;
      } else if (invite.status === 'accepted') {
        groupMap[key].accepted_members++;
      }
    });

    return Object.values(groupMap);
  };

  const filterGroups = () => {
    let filtered = familyGroups;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(group =>
        group.inviter_email.toLowerCase().includes(searchLower) ||
        group.inviter_name.toLowerCase().includes(searchLower) ||
        group.members.some(member => 
          member.invitee_name.toLowerCase().includes(searchLower) ||
          member.invitee_email.toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => {
        if (statusFilter === 'active') {
          return group.accepted_members > 0;
        } else if (statusFilter === 'pending') {
          return group.pending_invites > 0 && group.accepted_members === 0;
        }
        return true;
      });
    }

    setFilteredGroups(filtered);
  };

  const sendFamilyInvite = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('family-invites', {
        body: inviteForm
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family invite sent successfully"
      });

      setShowInviteDialog(false);
      setInviteForm({
        inviter_email: '',
        invitee_name: '',
        invitee_email: '',
        relationship: 'Family Member'
      });
      
      loadFamilyData();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send family invite",
        variant: "destructive"
      });
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite resent successfully"
      });
      
      loadFamilyData();
    } catch (error) {
      console.error('Error resending invite:', error);
      toast({
        title: "Error",
        description: "Failed to resend invite",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    totalFamilies: familyGroups.length,
    totalInvites: familyInvites.length,
    pendingInvites: familyInvites.filter(i => i.status === 'pending').length,
    acceptedMembers: familyInvites.filter(i => i.status === 'accepted').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Family Accounts</h1>
          <p className="text-muted-foreground">Loading family data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👨‍👩‍👧‍👦 Family Accounts</h1>
          <p className="text-muted-foreground">Manage family groups and member invitations</p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Send Family Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Family Invitation</DialogTitle>
              <DialogDescription>
                Invite a family member to join a LifeLink Sync protection plan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Inviter Email</Label>
                <Input
                  value={inviteForm.inviter_email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, inviter_email: e.target.value }))}
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <Label>Invitee Name</Label>
                <Input
                  value={inviteForm.invitee_name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, invitee_name: e.target.value }))}
                  placeholder="Family Member Name"
                />
              </div>
              <div>
                <Label>Invitee Email</Label>
                <Input
                  value={inviteForm.invitee_email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, invitee_email: e.target.value }))}
                  placeholder="child@example.com"
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={inviteForm.relationship} onValueChange={(value) => setInviteForm(prev => ({ ...prev, relationship: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Family Member">Family Member</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendFamilyInvite}>
                <Send className="h-4 w-4 mr-2" />
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-pink-500" />
              <div>
                <p className="text-xl font-bold">{stats.totalFamilies}</p>
                <p className="text-sm text-muted-foreground">Family Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{stats.totalInvites}</p>
                <p className="text-sm text-muted-foreground">Total Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-xl font-bold">{stats.pendingInvites}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-xl font-bold">{stats.acceptedMembers}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search families or members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Export Data</Button>
          </div>
        </CardContent>
      </Card>

      {/* Family Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Family Groups ({filteredGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Family Head</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status Summary</TableHead>
                  <TableHead>Latest Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group, index) => (
                  <TableRow key={group.inviter_email + index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{group.inviter_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {group.inviter_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {group.total_members} total members
                        </div>
                        {group.members.slice(0, 2).map((member) => (
                          <div key={member.id} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {member.invitee_name} ({member.relationship})
                          </div>
                        ))}
                        {group.members.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{group.members.length - 2} more...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="bg-green-500 mr-1">
                          {group.accepted_members} Active
                        </Badge>
                        {group.pending_invites > 0 && (
                          <Badge variant="outline">
                            {group.pending_invites} Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {group.members.length > 0 && (
                          <>
                            {new Date(group.members[0].created_at).toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              Last invite sent
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Individual Invites Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Family Invitations ({familyInvites.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inviter</TableHead>
                  <TableHead>Invitee</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familyInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="text-sm">
                        {invite.inviter_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invite.invitee_name}</div>
                        <div className="text-sm text-muted-foreground">{invite.invitee_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.relationship}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invite.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {invite.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => resendInvite(invite.id)}
                          >
                            Resend
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}