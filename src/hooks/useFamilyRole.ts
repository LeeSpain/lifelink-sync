import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'owner' | 'family_member' | 'none';

interface FamilyRoleData {
  role: UserRole;
  familyGroupId?: string;
  isOwner: boolean;
  isFamilyMember: boolean;
}

export function useFamilyRole() {
  return useQuery({
    queryKey: ['family-role'],
    queryFn: async (): Promise<FamilyRoleData> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 Family Role Check - User:', user?.id);
        if (!user) {
          console.log('❌ No user found');
          return { role: 'none', isOwner: false, isFamilyMember: false };
        }

        // Check if user is a family group owner
        console.log('🏠 Checking for owned family groups...');
        const { data: ownedGroups, error: ownerError } = await supabase
          .from('family_groups')
          .select('id')
          .eq('owner_user_id', user.id);

        console.log('🏠 Owner check result:', { ownedGroups, ownerError });

        if (ownedGroups && ownedGroups.length > 0) {
          console.log('✅ User is family group owner');
          return {
            role: 'owner',
            familyGroupId: ownedGroups[0].id,
            isOwner: true,
            isFamilyMember: false
          };
        }

        // Check if user is a family member
        console.log('👨‍👩‍👧‍👦 Checking for family memberships...');
        const { data: memberships, error: memberError } = await supabase
          .from('family_memberships')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('status', 'active');

        console.log('👨‍👩‍👧‍👦 Membership check result:', { memberships, memberError });

        if (memberships && memberships.length > 0) {
          console.log('✅ User is family member');
          return {
            role: 'family_member',
            familyGroupId: memberships[0].group_id,
            isOwner: false,
            isFamilyMember: true
          };
        }

        console.log('❌ User has no family role');
        return { role: 'none', isOwner: false, isFamilyMember: false };

      } catch (error) {
        console.error('Error checking family role:', error);
        return { role: 'none', isOwner: false, isFamilyMember: false };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}