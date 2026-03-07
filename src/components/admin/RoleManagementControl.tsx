import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoleManagementControlProps {
  userId: string;
  currentRole: string;
  customerEmail?: string;
}

export function RoleManagementControl({ userId, currentRole, customerEmail }: RoleManagementControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const roleOptions = [
    { value: 'user', label: 'User', description: 'Standard customer account' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access' },
  ];

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    if (newRole !== currentRole) {
      setShowConfirmDialog(true);
    }
  };

  const confirmRoleChange = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role updated to ${selectedRole} successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      setSelectedRole(currentRole);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelRoleChange = () => {
    setSelectedRole(currentRole);
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management
          </CardTitle>
          <CardDescription>
            Assign permissions and access level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-select">Account Role</Label>
            <Select value={selectedRole} onValueChange={handleRoleChange} disabled={isSaving}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCog className="h-4 w-4" />
            <span>Current role:</span>
            <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
              {currentRole}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the role from <strong>{currentRole}</strong> to <strong>{selectedRole}</strong>
              {customerEmail && ` for ${customerEmail}`}.
              {selectedRole === 'admin' && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Admin role grants full system access. Use with caution.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRoleChange} disabled={isSaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
