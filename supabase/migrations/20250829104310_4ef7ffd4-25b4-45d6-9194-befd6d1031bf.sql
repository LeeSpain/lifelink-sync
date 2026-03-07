-- Completely remove and rebuild family RLS policies with simpler approach
DROP POLICY IF EXISTS "Admins manage all family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family owners manage their groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family members view their groups" ON public.family_groups;

DROP POLICY IF EXISTS "Admins manage all family memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family owners manage memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Members view own membership" ON public.family_memberships;

-- Simple, non-recursive policies for family_groups
CREATE POLICY "Owners can access their family groups"
ON public.family_groups
FOR ALL
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Admins can access all family groups"
ON public.family_groups
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Simple, non-recursive policies for family_memberships  
CREATE POLICY "Users can view their own memberships"
ON public.family_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners can manage memberships in their groups"
ON public.family_memberships
FOR ALL
TO authenticated
USING (
  group_id IN (
    SELECT id FROM public.family_groups WHERE owner_user_id = auth.uid()
  )
)
WITH CHECK (
  group_id IN (
    SELECT id FROM public.family_groups WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all memberships"
ON public.family_memberships
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());