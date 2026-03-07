-- Fix infinite recursion in family RLS policies by using security definer functions

-- First, create security definer functions to check family roles without recursion
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

CREATE OR REPLACE FUNCTION public.is_family_group_owner(group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.family_groups fg 
    WHERE fg.id = group_id 
      AND fg.owner_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_member_of_group(group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.family_memberships fm 
    WHERE fm.group_id = group_id 
      AND fm.user_id = auth.uid() 
      AND fm.status = 'active'
  );
$$;

-- Drop existing problematic RLS policies on family_groups
DROP POLICY IF EXISTS "Family group owners manage groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family members can view their group" ON public.family_groups;
DROP POLICY IF EXISTS "Users can manage their own family groups" ON public.family_groups;

-- Create new RLS policies using security definer functions for family_groups
CREATE POLICY "Family group owners can manage their groups"
ON public.family_groups
FOR ALL
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Family members can view groups they belong to"
ON public.family_groups
FOR SELECT
TO authenticated
USING (public.is_family_member_of_group(id));

-- Drop existing problematic RLS policies on family_memberships
DROP POLICY IF EXISTS "Family group owners can manage memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family members can view memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.family_memberships;

-- Create new RLS policies using security definer functions for family_memberships
CREATE POLICY "Family group owners can manage memberships in their groups"
ON public.family_memberships
FOR ALL
TO authenticated
USING (public.is_family_group_owner(group_id))
WITH CHECK (public.is_family_group_owner(group_id));

CREATE POLICY "Family members can view their own membership"
ON public.family_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Family members can view other memberships in their group"
ON public.family_memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.family_memberships fm2 
    WHERE fm2.group_id = family_memberships.group_id 
      AND fm2.user_id = auth.uid() 
      AND fm2.status = 'active'
  )
);