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
import { useTranslation } from 'react-i18next';

export function FamilyPage() {
  const { t } = useTranslation();
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
        title: t('familyPage.error'),
        description: t('familyPage.failedToLoadData'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteData.name || !inviteData.email || !inviteData.relationship) {
      toast({
        title: t('familyPage.missingInformation'),
        description: t('familyPage.fillAllFields'),
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
        title: t('familyPage.invitationSent'),
        description: t('familyPage.invitationSentTo', { name: inviteData.name })
      });

      setShowInviteForm(false);
      setInviteData({ name: "", email: "", relationship: "" });
      loadFamilyData();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: t('familyPage.error'),
        description: t('familyPage.failedToSendInvitation'),
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary">{t('familyPage.active')}</Badge>;
      case "offline":
        return <Badge variant="secondary">{t('familyPage.offline')}</Badge>;
      case "pending":
        return <Badge variant="outline">{t('familyPage.pending')}</Badge>;
      default:
        return <Badge variant="secondary">{t('familyPage.unknown')}</Badge>;
    }
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('familyPage.title')}</h1>
            <p className="text-muted-foreground">{t('familyPage.subtitle')}</p>
          </div>
          <Button onClick={() => setShowInviteForm(true)} variant="outline" size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('familyPage.inviteFamilyMember')}
          </Button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t('familyPage.inviteFamilyMember')}</CardTitle>
              <CardDescription>
                {t('familyPage.inviteDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('familyPage.fullName')}</Label>
                  <Input
                    id="name"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                    placeholder={t('familyPage.enterFullName')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('familyPage.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    placeholder={t('familyPage.enterEmail')}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="relationship">{t('familyPage.relationship')}</Label>
                <Input
                  id="relationship"
                  value={inviteData.relationship}
                  onChange={(e) => setInviteData({...inviteData, relationship: e.target.value})}
                  placeholder={t('familyPage.relationshipPlaceholder')}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInvite} size="sm">{t('familyPage.sendInvitation')}</Button>
                <Button variant="outline" size="sm" onClick={() => setShowInviteForm(false)}>{t('familyPage.cancel')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('familyPage.familyMembers')} ({familyMembers.length})
            </CardTitle>
            <CardDescription>
              {t('familyPage.monitorSafetyStatus')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Accepted Family Members */}
              {familyMembers.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-base">{t('familyPage.connectedFamilyMembers')}</h4>
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
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
                        <Badge variant="secondary">{t('familyPage.connected')}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('familyPage.joined')}: {new Date(member.accepted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-base">{t('familyPage.pendingInvitations')}</h4>
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
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
                        <Badge variant="outline">{t('familyPage.pending')}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('familyPage.sent')}: {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {familyMembers.length === 0 && pendingInvites.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('familyPage.noFamilyMembers')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('familyPage.startBuildingNetwork')}
                  </p>
                  <Button onClick={() => setShowInviteForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('familyPage.inviteFirstFamilyMember')}
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('familyPage.loadingFamilyMembers')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}