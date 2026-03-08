import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useTranslation } from 'react-i18next';

interface FamilyInviteQuickSetupProps {
  onMemberAdded: () => void;
}

const FamilyInviteQuickSetup: React.FC<FamilyInviteQuickSetupProps> = ({ onMemberAdded }) => {
  const { t } = useTranslation();
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
        title: t('familyDashboard.missingInfo'),
        description: t('familyDashboard.missingInfoDesc'),
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
        title: t('familyDashboard.invitationSent'),
        description: t('familyDashboard.invitationSentDesc', { name: formData.name }),
      });

      // Reset form
      setFormData({ name: '', email: '', phone: '', relationship: 'Family Member' });
      onMemberAdded();

    } catch (error) {
      console.error('Invite error:', error);
      toast({
        title: t('familyDashboard.invitationFailed'),
        description: t('familyDashboard.invitationFailedDesc'),
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
        <CardTitle>{t('familyDashboard.addFamilyMember')}</CardTitle>
        <CardDescription>
          {t('familyDashboard.inviteToCircle')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('familyDashboard.fullName')}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('familyDashboard.enterFullName')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('familyDashboard.emailAddress')}</Label>
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
          <Label htmlFor="phone">{t('familyDashboard.phoneOptional')}</Label>
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
          <Label htmlFor="relationship">{t('familyDashboard.relationship')}</Label>
          <select
            id="relationship"
            value={formData.relationship}
            onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
            className="w-full p-2 border border-input bg-background rounded-md"
          >
            <option value="Family Member">{t('familyDashboard.relationshipFamilyMember')}</option>
            <option value="Spouse">{t('familyDashboard.relationshipSpouse')}</option>
            <option value="Child">{t('familyDashboard.relationshipChild')}</option>
            <option value="Parent">{t('familyDashboard.relationshipParent')}</option>
            <option value="Sibling">{t('familyDashboard.relationshipSibling')}</option>
            <option value="Friend">{t('familyDashboard.relationshipFriend')}</option>
            <option value="Caregiver">{t('familyDashboard.relationshipCaregiver')}</option>
          </select>
        </div>

        <Button 
          onClick={handleInvite} 
          disabled={isLoading || !formData.name || !formData.email}
          className="w-full"
        >
          {isLoading ? (
            t('familyDashboard.sendingInvitation')
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              {t('familyDashboard.sendInvitation')}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {t('familyDashboard.inviteEmailDesc')}
        </p>
      </CardContent>
    </Card>
  );
};

export default FamilyInviteQuickSetup;