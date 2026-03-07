import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ADDONS_QUERY_KEY = ['user', 'addons'] as const;

export interface AddonCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: string;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  features: string[];
  icon: string | null;
  category: string;
}

export interface MemberAddon {
  id: string;
  user_id: string;
  addon_id: string;
  status: string;
  quantity: number;
  free_units: number;
  activated_at: string;
  addon_catalog: {
    slug: string;
    name: string;
    price: number;
    currency: string;
    icon: string | null;
    category: string;
  };
}

export interface AddonsData {
  catalog: AddonCatalogItem[];
  active: MemberAddon[];
  clara_complete_unlocked: boolean;
  active_addons: string[];
}

export function useAddons() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ADDONS_QUERY_KEY,
    queryFn: async (): Promise<AddonsData> => {
      const { data, error } = await supabase.functions.invoke('manage-addons', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Error fetching addons:', error);
        throw error;
      }

      return data as AddonsData;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAddonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, addon_slug, quantity }: {
      action: 'add' | 'remove';
      addon_slug: string;
      quantity?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-addons', {
        body: { action, addon_slug, quantity }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['user', 'subscription'] });
    },
  });
}
