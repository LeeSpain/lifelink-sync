import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Mail, Shield, Users, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface OrganizationUser {
  id: string;
  user_id: string;
  role: string;
  language: string;
  is_active: boolean;
  created_at: string;
  organizations: {
    name: string;
    region: string;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const RegionalUsersPage = () => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    organization_id: '',
    role: 'regional_operator' as const,
    language: 'es'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, region')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['organization-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          *,
          organizations (
            name,
            region
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationUser[];
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data, error } = await supabase.functions.invoke('regional-user-invite', {
        body: {
          email: userData.email,
          organization_id: userData.organization_id,
          role: userData.role,
          language: userData.language
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      setIsInviteOpen(false);
      setNewUser({ email: '', organization_id: '', role: 'regional_operator', language: 'es' });
      toast({
        title: "User Invited",
        description: "The invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
      const { error } = await supabase
        .from('organization_users')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      toast({
        title: "User Status Updated",
        description: "The user status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInviteUser = () => {
    if (!newUser.email || !newUser.organization_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    inviteUserMutation.mutate(newUser);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'platform_admin': return 'destructive';
      case 'regional_supervisor': return 'default';
      case 'regional_operator': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'platform_admin': return 'Platform Admin';
      case 'regional_supervisor': return 'Supervisor';
      case 'regional_operator': return 'Operator';
      default: return role;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Regional Users</h1>
          <p className="text-muted-foreground">
            Manage operators and supervisors for regional organizations
          </p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Regional User</DialogTitle>
              <DialogDescription>
                Invite a new operator or supervisor to a regional organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="operator@emergency.es"
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <Select 
                  value={newUser.organization_id} 
                  onValueChange={(value) => setNewUser({ ...newUser, organization_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} - {org.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regional_operator">Regional Operator</SelectItem>
                    <SelectItem value="regional_supervisor">Regional Supervisor</SelectItem>
                    <SelectItem value="platform_admin">Platform Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Preferred Language</Label>
                <Select 
                  value={newUser.language} 
                  onValueChange={(value) => setNewUser({ ...newUser, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="nl">Nederlands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteUser}
                  disabled={inviteUserMutation.isPending}
                >
                  {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Regional Staff
          </CardTitle>
          <CardDescription>
            All operators and supervisors across regional organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {user.profiles?.first_name} {user.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.profiles?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.organizations.name}</div>
                      <div className="text-sm text-muted-foreground">{user.organizations.region}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      <Shield className="mr-1 h-3 w-3" />
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.language.toUpperCase()}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleUserStatusMutation.mutate({
                            userId: user.id,
                            isActive: user.is_active
                          })}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users?.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Yet</h3>
              <p className="text-muted-foreground mb-4">
                Invite your first regional operator or supervisor.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalUsersPage;