import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmailManagementControlProps {
  userId: string;
  currentEmail?: string;
  isVerified?: boolean;
}

export function EmailManagementControl({ userId, currentEmail, isVerified = false }: EmailManagementControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(currentEmail || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!email || email === currentEmail) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      // Update subscriber email if exists
      const { error } = await supabase
        .from('subscribers')
        .update({ email })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Email updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEmail(currentEmail || '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Management
        </CardTitle>
        <CardDescription>
          Update customer email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-input">Email Address</Label>
            <Badge variant={isVerified ? 'default' : 'secondary'}>
              {isVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
          
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={isSaving}
              />
              <Button
                size="icon"
                onClick={handleSave}
                disabled={isSaving || !email}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{currentEmail || 'No email set'}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Note: Changing the email will require the customer to verify the new address.
        </p>
      </CardContent>
    </Card>
  );
}
