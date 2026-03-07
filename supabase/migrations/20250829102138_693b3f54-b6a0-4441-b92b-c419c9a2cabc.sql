-- Fix infinite recursion in family RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Family group owners manage groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family members can view their group" ON public.family_groups;
DROP POLICY IF EXISTS "Users can manage their own family groups" ON public.family_groups;

-- Create simple, non-recursive policies for family_groups
CREATE POLICY "Users can manage their owned family groups" 
ON public.family_groups 
FOR ALL 
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Admin can manage all family groups" 
ON public.family_groups 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fix family_memberships policies to avoid recursion
DROP POLICY IF EXISTS "Admins can manage all family memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family group owners can manage memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Family members can view group memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Users can view their own family memberships" ON public.family_memberships;

CREATE POLICY "Users can view their own memberships" 
ON public.family_memberships 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Family group owners can manage memberships" 
ON public.family_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.family_groups fg 
    WHERE fg.id = family_memberships.group_id 
    AND fg.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_groups fg 
    WHERE fg.id = family_memberships.group_id 
    AND fg.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all family memberships" 
ON public.family_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);