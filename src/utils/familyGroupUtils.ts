import { supabase } from '@/integrations/supabase/client';

/**
 * Gets or creates a valid family group UUID for the current user
 * Returns a proper UUID instead of demo strings
 */
export const getFamilyGroupId = async (userId: string): Promise<string | null> => {
  try {
    // First check if user owns a family group
    const { data: ownedGroup } = await supabase
      .from('family_groups')
      .select('id')
      .eq('owner_user_id', userId)
      .single();

    if (ownedGroup?.id) {
      return ownedGroup.id;
    }

    // Check if user is a member of a family group
    const { data: membership } = await supabase
      .from('family_memberships')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membership?.group_id) {
      return membership.group_id;
    }

    // Create a new family group for the user
    const { data: newGroup, error } = await supabase
      .from('family_groups')
      .insert({
        owner_user_id: userId,
        owner_seat_quota: 5
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create family group:', error);
      return null;
    }

    return newGroup.id;
  } catch (error) {
    console.error('Error in getFamilyGroupId:', error);
    return null;
  }
};

/**
 * Validates that a family group ID is a valid UUID
 */
export const isValidFamilyGroupId = (groupId: string | undefined): boolean => {
  if (!groupId) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(groupId);
};