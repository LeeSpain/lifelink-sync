import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface FamilyMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  status: 'active' | 'pending' | 'inactive';
  billing_status?: string;
  created_at: string;
  type: 'member' | 'invite';
  invite_id?: string;
  emergency_contact_id?: string;
}

export interface PendingInvite {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  status: 'pending' | 'expired' | 'declined';
  created_at: string;
  expires_at: string;
}

export function useFamilyMembers(groupId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['family-members', groupId],
    queryFn: async (): Promise<{ members: FamilyMember[]; pendingInvites: PendingInvite[] }> => {
      if (!user || !groupId) {
        return { members: [], pendingInvites: [] };
      }

      try {
        // Get active family members
        const { data: memberships, error: memberError } = await supabase
          .from('family_memberships')
          .select(`
            id,
            user_id,
            billing_status,
            created_at
          `)
          .eq('group_id', groupId)
          .eq('status', 'active');

        if (memberError) throw memberError;

        // Get emergency contacts for this owner (to get relationship info)
        const { data: emergencyContacts, error: contactError } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'family');

        if (contactError) throw contactError;

        // Get pending family invites
        const { data: invites, error: inviteError } = await supabase
          .from('family_invites')
          .select('*')
          .eq('inviter_user_id', user.id)
          .in('status', ['pending', 'expired']);

        if (inviteError) throw inviteError;

        // Get profiles for members to get their details
        const memberUserIds = memberships?.map(m => m.user_id).filter(Boolean) || [];
        let profiles: any[] = [];
        
        if (memberUserIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, phone')
            .in('user_id', memberUserIds);
          
          if (!profileError) {
            profiles = profileData || [];
          }
        }

        // Process members
        const members: FamilyMember[] = memberships?.map(membership => {
          const profile = profiles.find(p => p.user_id === membership.user_id);
          const contact = emergencyContacts?.find(c => 
            c.email === profile?.email || c.phone === profile?.phone
          );

          return {
            id: membership.id,
            user_id: membership.user_id,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
            email: '', // We don't have email in profiles table
            phone: profile?.phone || '',
            relationship: contact?.relationship || 'Family Member',
            status: 'active' as const,
            billing_status: membership.billing_status,
            created_at: membership.created_at,
            type: 'member' as const,
            emergency_contact_id: contact?.id
          };
        }) || [];

        // Process pending invites
        const pendingInvites: PendingInvite[] = invites?.map(invite => ({
          id: invite.id,
          name: invite.invitee_name || invite.name,
          email: invite.invitee_email,
          phone: invite.phone || '',
          relationship: invite.relationship,
          status: invite.status as 'pending' | 'expired' | 'declined',
          created_at: invite.created_at,
          expires_at: invite.expires_at
        })) || [];

        return { members, pendingInvites };
      } catch (error) {
        console.error('Error loading family members:', error);
        return { members: [], pendingInvites: [] };
      }
    },
    enabled: !!user && !!groupId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  });

  
}

export function useFamilyMemberActions() {
  const queryClient = useQueryClient();

  const resendInvite = async (inviteId: string) => {
    const { data, error } = await supabase.functions.invoke('family-invite-management', {
      body: {
        action: 'resend',
        invite_id: inviteId
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['family-members'] });
    
    return data;
  };

  const cancelInvite = async (inviteId: string) => {
    const { data, error } = await supabase.functions.invoke('family-invite-management', {
      body: {
        action: 'cancel',
        invite_id: inviteId
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['family-members'] });
    
    return data;
  };

  const removeMember = async (membershipId: string) => {
    const { error } = await supabase
      .from('family_memberships')
      .update({ status: 'inactive' })
      .eq('id', membershipId);

    if (error) throw error;

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['family-members'] });
  };

  return {
    resendInvite,
    cancelInvite,
    removeMember
  };
}