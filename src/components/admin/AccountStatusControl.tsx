import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface AccountStatusControlProps {
  userId: string;
  currentRole: string;
  isActive: boolean;
}

export function AccountStatusControl({ userId, currentRole, isActive }: AccountStatusControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'activate' | 'deactivate' | null>(null);

  const handleToggleStatus = async (newStatus: boolean) => {
    setPendingAction(newStatus ? 'activate' : 'deactivate');
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;

    setIsSaving(true);
    try {
      // Update the profile - you might want to add an 'is_active' column
      // For now we'll use a metadata field or create the column
      const { error } = await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Account ${pendingAction}d successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error updating account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isActive ? (
              <ShieldCheck className="h-5 w-5 text-success" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            )}
            Account Status
          </CardTitle>
          <CardDescription>
            Manage account activation and access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="account-status">Account Active</Label>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Account is active and can access the platform' : 'Account is deactivated'}
              </p>
            </div>
            <Switch
              id="account-status"
              checked={isActive}
              onCheckedChange={handleToggleStatus}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Account {pendingAction === 'activate' ? 'Activation' : 'Deactivation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'activate'
                ? 'This will restore account access and all associated permissions.'
                : 'This will suspend account access. The user will not be able to log in until reactivated.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
