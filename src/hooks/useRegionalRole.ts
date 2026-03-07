import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RegionalRole = 'regional_operator' | 'regional_supervisor' | 'platform_admin' | 'none';

interface RegionalRoleData {
  role: RegionalRole;
  organizationId?: string;
  organizationName?: string;
  isRegionalOperator: boolean;
  isRegionalSupervisor: boolean;
  isPlatformAdmin: boolean;
}

export function useRegionalRole() {
  return useQuery({
    queryKey: ['regional-role'],
    queryFn: async (): Promise<RegionalRoleData> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { 
            role: 'none', 
            isRegionalOperator: false, 
            isRegionalSupervisor: false,
            isPlatformAdmin: false
          };
        }

        // Check organization membership
        const { data: orgUser, error } = await supabase
          .from('organization_users')
          .select(`
            role,
            organization_id,
            organizations (
              name
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error || !orgUser) {
          return { 
            role: 'none', 
            isRegionalOperator: false, 
            isRegionalSupervisor: false,
            isPlatformAdmin: false
          };
        }

        return {
          role: orgUser.role as RegionalRole,
          organizationId: orgUser.organization_id,
          organizationName: orgUser.organizations?.name,
          isRegionalOperator: orgUser.role === 'regional_operator',
          isRegionalSupervisor: orgUser.role === 'regional_supervisor',
          isPlatformAdmin: orgUser.role === 'platform_admin'
        };

      } catch (error) {
        console.error('Error checking regional role:', error);
        return { 
          role: 'none', 
          isRegionalOperator: false, 
          isRegionalSupervisor: false,
          isPlatformAdmin: false
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}