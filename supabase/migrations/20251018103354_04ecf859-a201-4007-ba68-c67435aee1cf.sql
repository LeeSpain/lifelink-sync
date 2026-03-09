-- Add admin RLS policies to profiles table
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;
CREATE POLICY "admin_select_all_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
CREATE POLICY "admin_update_all_profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_all_profiles" ON public.profiles;
CREATE POLICY "admin_delete_all_profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (is_admin());