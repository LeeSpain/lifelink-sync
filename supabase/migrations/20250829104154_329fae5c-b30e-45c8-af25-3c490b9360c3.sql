-- Remove duplicate and problematic policies
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Owners manage group memberships" ON public.family_memberships;
DROP POLICY IF EXISTS "Users view own memberships" ON public.family_memberships;