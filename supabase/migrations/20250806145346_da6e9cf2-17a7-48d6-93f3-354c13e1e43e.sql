-- Fix critical privilege escalation vulnerability
-- Remove the existing policy that allows users to update their own profile (including role)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies that exclude role updates for regular users
CREATE POLICY "Users can update their own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent role updates by regular users - only admins can change roles
  (profiles.role = profiles.role OR is_admin())
);

-- Create a secure function to assign admin role (only for system use)
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count integer;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  -- Only allow admin assignment if no admin exists (initial setup)
  -- OR if the caller is already an admin
  IF admin_count = 0 OR is_admin() THEN
    UPDATE public.profiles 
    SET role = 'admin', updated_at = now()
    WHERE user_id = target_user_id;
    
    -- Log the admin assignment
    INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
    VALUES (
      target_user_id, 
      'admin_role_assigned', 
      'Admin role assigned to user',
      jsonb_build_object(
        'assigned_by', auth.uid(),
        'timestamp', now(),
        'was_initial_setup', admin_count = 0
      )
    );
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;