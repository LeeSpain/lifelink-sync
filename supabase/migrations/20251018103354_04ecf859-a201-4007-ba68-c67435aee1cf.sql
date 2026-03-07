-- Add admin RLS policies to profiles table
CREATE POLICY "admin_select_all_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "admin_update_all_profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "admin_delete_all_profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (is_admin());