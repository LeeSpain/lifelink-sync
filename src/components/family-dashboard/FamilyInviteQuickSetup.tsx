import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface FamilyInviteQuickSetupProps {
  onMemberAdded: () => void;
}

const FamilyInviteQuickSetup: React.FC<FamilyInviteQuickSetupProps> = ({ onMemberAdded }) => {
  const { user } = useOptimizedAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'Family Member'
  });

  const handleInvite = async () => {
    if (!user || !formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide name and email for the family member",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // First ensure user has a family group
      let { data: familyGroup } = await supabase
        .from('family_groups')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (!familyGroup) {
        // Create family group
        const { data: newGroup, error: groupError } = await supabase
          .from('family_groups')
          .insert({
            owner_user_id: user.id,
            owner_seat_quota: 5
          })
          .select()
          .single();

        if (groupError) throw groupError;
        familyGroup = newGroup;
      }

      // Send family invite
      const { data, error } = await supabase.functions.invoke('family-invites', {
        body: {
          invitee_name: formData.name,
          invitee_email: formData.email,
          phone: formData.phone,
          relationship: formData.relationship,
          group_id: familyGroup.id
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent! 📧",
        description: `Family invitation sent to ${formData.name}`,
      });

      // Reset form
      setFormData({ name: '', email: '', phone: '', relationship: 'Family Member' });
      onMemberAdded();

    } catch (error) {
      console.error('Invite error:', error);
      toast({
        title: "Invitation Failed",
        description: "Unable to send family invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Add Family Member</CardTitle>
        <CardDescription>
          Invite family members to join your tracking circle
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="pl-10"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="pl-10"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <select
            id="relationship"
            value={formData.relationship}
            onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
            className="w-full p-2 border border-input bg-background rounded-md"
          >
            <option value="Family Member">Family Member</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Friend">Friend</option>
            <option value="Caregiver">Caregiver</option>
          </select>
        </div>

        <Button 
          onClick={handleInvite} 
          disabled={isLoading || !formData.name || !formData.email}
          className="w-full"
        >
          {isLoading ? (
            "Sending Invitation..."
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Send Invitation
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          They'll receive an email invitation to join your family tracking circle
        </p>
      </CardContent>
    </Card>
  );
};

export default FamilyInviteQuickSetup;