-- Drop ALL existing RLS policies on family tables to start fresh
DROP POLICY IF EXISTS "Admins can manage all family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family group owners can manage their groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family group owners manage groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family members can view their group" ON public.family_groups;
DROP POLICY IF EXISTS "Family members can view groups they belong to" ON public.family_groups;
DROP POLICY IF EXISTS "Users can manage their own family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Users can view their own family groups" ON public.family_groups;

DROP POLICY IF EXISTS "Admins can manage all family memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family group owners can manage memberships in their groups" ON public.family_memberships;
DROP POLICY IF EXISTS "Family group owners can manage memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family members can view memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family members can view their own membership" ON public.family_memberships;
DROP POLICY IF EXISTS "Family members can view other memberships in their group" ON public.family_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.family_memberships;

-- Create security definer functions to check family roles without recursion
CREATE OR REPLACE FUNCTION public.get_user_family_group_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT fg.id 
  FROM public.family_groups fg 
  WHERE fg.owner_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_family_membership_group_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT fm.group_id 
  FROM public.family_memberships fm 
  WHERE fm.user_id = auth.uid() 
    AND fm.status = 'active'
  LIMIT 1;
$$;

-- Create new clean RLS policies using security definer functions
CREATE POLICY "Family owners manage their groups"
ON public.family_groups
FOR ALL
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Family members view their groups"
ON public.family_groups
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT fm.group_id 
    FROM public.family_memberships fm 
    WHERE fm.user_id = auth.uid() 
      AND fm.status = 'active'
  )
);

CREATE POLICY "Family owners manage memberships"
ON public.family_memberships
FOR ALL
TO authenticated
USING (
  group_id IN (
    SELECT fg.id 
    FROM public.family_groups fg 
    WHERE fg.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  group_id IN (
    SELECT fg.id 
    FROM public.family_groups fg 
    WHERE fg.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Members view own membership"
ON public.family_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Keep admin policies
CREATE POLICY "Admins manage all family groups"
ON public.family_groups
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins manage all family memberships"
ON public.family_memberships
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());