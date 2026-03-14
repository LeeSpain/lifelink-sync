import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Users, Shield, LogOut } from "lucide-react";

const FamilyMemberView = () => {
  const [familyInfo, setFamilyInfo] = useState<{
    groupName?: string;
    ownerName?: string;
    memberCount?: number;
    myStatus?: string;
    joinedAt?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadMemberInfo();
  }, []);

  const loadMemberInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('family_memberships')
        .select('group_id, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        setFamilyInfo(null);
        return;
      }

      const { data: group } = await supabase
        .from('family_groups')
        .select('owner_user_id')
        .eq('id', membership.group_id)
        .single();

      let ownerName = 'Your family';
      if (group?.owner_user_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', group.owner_user_id)
          .maybeSingle();
        if (ownerProfile?.first_name) {
          ownerName = `${ownerProfile.first_name}${ownerProfile.last_name ? ' ' + ownerProfile.last_name : ''}`;
        }
      }

      const { count } = await supabase
        .from('family_memberships')
        .select('id', { count: 'exact' })
        .eq('group_id', membership.group_id)
        .eq('status', 'active');

      setFamilyInfo({
        ownerName,
        memberCount: count ?? 0,
        myStatus: membership.status,
        joinedAt: membership.created_at,
      });
    } catch (err) {
      console.error('Error loading member info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveFamily = async () => {
    setIsLeaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('family_memberships')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: t('familyMember.leftFamily', { defaultValue: 'Left family circle' }),
        description: t('familyMember.leftFamilyDesc', { defaultValue: 'You have left the family circle. The owner has been notified.' }),
      });
      setShowLeaveDialog(false);
      setFamilyInfo(null);
    } catch (err) {
      toast({
        title: t('familyDashboard.error'),
        description: err instanceof Error ? err.message : 'Failed to leave family',
        variant: 'destructive',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!familyInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('familyMember.title', { defaultValue: 'Family Circle' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('familyMember.notInFamily', { defaultValue: 'You are not currently part of a family circle.' })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('familyMember.title', { defaultValue: 'Family Circle' })}
            <Badge variant="secondary">{t('familyMember.member', { defaultValue: 'Member' })}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">{t('familyMember.protectedBy', { defaultValue: 'Protected by {{name}}', name: familyInfo.ownerName })}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('familyMember.protectedDesc', { defaultValue: 'Your emergency contacts and CLARA AI are active. If you trigger an SOS, your family circle will be notified instantly.' })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('familyMember.circleSize', { defaultValue: 'Circle size' })}</p>
              <p className="text-lg font-bold">{familyInfo.memberCount} {t('familyMember.members', { defaultValue: 'members' })}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('familyMember.joinedOn', { defaultValue: 'Joined' })}</p>
              <p className="text-lg font-bold">{familyInfo.joinedAt ? new Date(familyInfo.joinedAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setShowLeaveDialog(true)}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              {t('familyMember.leaveFamily', { defaultValue: 'Leave family circle' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('familyMember.leaveConfirmTitle', { defaultValue: 'Leave family circle?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('familyMember.leaveConfirmDesc', { defaultValue: 'You will no longer receive emergency alerts from this family circle. The owner will be notified. You can be re-invited later.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('familyDashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleLeaveFamily}
              disabled={isLeaving}
            >
              {isLeaving ? t('familyMember.leaving', { defaultValue: 'Leaving...' }) : t('familyMember.confirmLeave', { defaultValue: 'Leave circle' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FamilyMemberView;
