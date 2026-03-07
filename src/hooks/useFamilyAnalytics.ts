import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FamilyMetrics {
  totalFamilyGroups: number;
  totalFamilyMembers: number;
  activeFamilyMembers: number;
  pendingInvites: number;
  activeSosEvents: number;
  totalSosEvents: number;
  inviteAcceptanceRate: number;
  avgFamilySize: number;
  familyRevenue: number;
  sosResponseTime: number;
}

export function useFamilyAnalytics() {
  return useQuery({
    queryKey: ['family-analytics'],
    queryFn: async (): Promise<FamilyMetrics> => {
      try {
        // Fetch family groups data
        const [groupsResult, membersResult, invitesResult, sosEventsResult] = await Promise.allSettled([
          supabase.from('family_groups').select('id', { count: 'exact', head: true }),
          supabase.from('family_memberships').select('id, status', { count: 'exact' }),
          supabase.from('family_invites').select('id, status', { count: 'exact' }),
          supabase.from('sos_events').select('id, status, created_at, resolved_at', { count: 'exact' })
        ]);

        // Process family groups
        const totalFamilyGroups = groupsResult.status === 'fulfilled' ? (groupsResult.value.count || 0) : 0;

        // Process family members
        let totalFamilyMembers = 0;
        let activeFamilyMembers = 0;
        if (membersResult.status === 'fulfilled' && membersResult.value.data) {
          totalFamilyMembers = membersResult.value.data.length;
          activeFamilyMembers = membersResult.value.data.filter(m => m.status === 'active').length;
        }

        // Process family invites
        let pendingInvites = 0;
        let acceptedInvites = 0;
        let totalInvites = 0;
        if (invitesResult.status === 'fulfilled' && invitesResult.value.data) {
          totalInvites = invitesResult.value.data.length;
          pendingInvites = invitesResult.value.data.filter(i => i.status === 'pending').length;
          acceptedInvites = invitesResult.value.data.filter(i => i.status === 'accepted').length;
        }

        // Process SOS events
        let activeSosEvents = 0;
        let totalSosEvents = 0;
        let avgResponseTime = 0;
        if (sosEventsResult.status === 'fulfilled' && sosEventsResult.value.data) {
          totalSosEvents = sosEventsResult.value.data.length;
          activeSosEvents = sosEventsResult.value.data.filter(s => s.status === 'active').length;
          
          // Calculate average response time for resolved events
          const resolvedEvents = sosEventsResult.value.data.filter(s => s.status === 'resolved' && s.resolved_at);
          if (resolvedEvents.length > 0) {
            const totalResponseTime = resolvedEvents.reduce((sum, event) => {
              const responseTime = new Date(event.resolved_at).getTime() - new Date(event.created_at).getTime();
              return sum + (responseTime / 1000 / 60); // Convert to minutes
            }, 0);
            avgResponseTime = totalResponseTime / resolvedEvents.length;
          }
        }

        // Calculate metrics
        const inviteAcceptanceRate = totalInvites > 0 ? (acceptedInvites / totalInvites) * 100 : 0;
        const avgFamilySize = totalFamilyGroups > 0 ? totalFamilyMembers / totalFamilyGroups : 0;

        // Estimate family revenue (placeholder calculation)
        const familyRevenue = activeFamilyMembers * 25; // €25 per active family member

        return {
          totalFamilyGroups,
          totalFamilyMembers,
          activeFamilyMembers,
          pendingInvites,
          activeSosEvents,
          totalSosEvents,
          inviteAcceptanceRate: parseFloat(inviteAcceptanceRate.toFixed(1)),
          avgFamilySize: parseFloat(avgFamilySize.toFixed(1)),
          familyRevenue,
          sosResponseTime: parseFloat(avgResponseTime.toFixed(1))
        };
      } catch (error) {
        console.error('Error fetching family analytics:', error);
        return {
          totalFamilyGroups: 0,
          totalFamilyMembers: 0,
          activeFamilyMembers: 0,
          pendingInvites: 0,
          activeSosEvents: 0,
          totalSosEvents: 0,
          inviteAcceptanceRate: 0,
          avgFamilySize: 0,
          familyRevenue: 0,
          sosResponseTime: 0
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false,
  });
}