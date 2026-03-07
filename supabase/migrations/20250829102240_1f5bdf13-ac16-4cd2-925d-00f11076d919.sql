-- Helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_family_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_memberships fm
    WHERE fm.group_id = p_group_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_group_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_groups fg
    WHERE fg.id = p_group_id
      AND fg.owner_user_id = auth.uid()
  );
$$;

-- family_groups: replace recursive policies
DROP POLICY IF EXISTS "Admins can manage all family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family group owners manage groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family members can view their group" ON public.family_groups;
DROP POLICY IF EXISTS "Users can manage their own family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Users can manage their owned family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Admin can manage all family groups" ON public.family_groups;

CREATE POLICY "Admins manage groups"
ON public.family_groups
FOR ALL
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

CREATE POLICY "Owners manage their groups"
ON public.family_groups
FOR ALL
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Members can view group"
ON public.family_groups
FOR SELECT
USING (public.is_family_group_member(id));

-- family_memberships: replace recursive/problematic policies
DROP POLICY IF EXISTS "Admins can manage all family memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family group owners can manage memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family members can view group memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Users can view their own family memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Admin can manage all family memberships" ON public.family_memberships;

CREATE POLICY "Admins manage memberships"
ON public.family_memberships
FOR ALL
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

CREATE POLICY "Users view own memberships"
ON public.family_memberships
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners manage group memberships"
ON public.family_memberships
FOR ALL
USING (public.is_family_group_owner(group_id))
WITH CHECK (public.is_family_group_owner(group_id));