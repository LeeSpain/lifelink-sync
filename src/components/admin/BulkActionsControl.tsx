import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BulkActionsControlProps {
  userId: string;
  customerName: string;
}

export function BulkActionsControl({ userId, customerName }: BulkActionsControlProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all customer data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId);

      const { data: connections } = await supabase
        .from('connections')
        .select('*')
        .eq('owner_id', userId);

      const exportData = {
        profile,
        subscriber,
        emergency_contacts: contacts,
        connections,
        exported_at: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_${userId}_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Customer data exported successfully',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export customer data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete related records first (cascade should handle this, but being explicit)
      await Promise.all([
        supabase.from('emergency_contacts').delete().eq('user_id', userId),
        supabase.from('connections').delete().eq('owner_id', userId),
        supabase.from('customer_notes').delete().eq('customer_id', userId),
        supabase.from('subscribers').delete().eq('user_id', userId),
      ]);

      // Delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });

      // Navigate back to customers list
      navigate('/admin-dashboard/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Export or remove customer data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Customer Data
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Customer
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{customerName}</strong> and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profile information</li>
                <li>Emergency contacts</li>
                <li>Connections</li>
                <li>Subscription data</li>
                <li>Notes and activity logs</li>
              </ul>
              <p className="mt-4 text-destructive font-semibold">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
