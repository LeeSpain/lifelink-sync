-- Fix critical security vulnerabilities

-- 1. Fix the profiles UPDATE policy to prevent unauthorized role changes
DROP POLICY IF EXISTS "Users can update their own profile except role" ON public.profiles;

-- Create a more secure update policy that prevents role modification through normal updates
CREATE POLICY "Users can update their own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- 2. Add logging for admin role assignments (enhance existing assign_admin_role function)
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  admin_count integer;
  current_user_role text;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  -- Get current user's role for logging
  SELECT role INTO current_user_role
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Only allow admin assignment if no admin exists (initial setup)
  -- OR if the caller is already an admin
  IF admin_count = 0 OR is_admin() THEN
    UPDATE public.profiles 
    SET role = 'admin', updated_at = now()
    WHERE user_id = target_user_id;
    
    -- Enhanced logging for admin assignment
    INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
    VALUES (
      target_user_id, 
      'admin_role_assigned', 
      'Admin role assigned to user',
      jsonb_build_object(
        'assigned_by', auth.uid(),
        'assigned_by_role', current_user_role,
        'timestamp', now(),
        'was_initial_setup', admin_count = 0,
        'target_user_id', target_user_id,
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
      )
    );
    
    RETURN true;
  ELSE
    -- Log unauthorized attempt
    INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
      'admin_role_assignment_denied', 
      'Unauthorized admin role assignment attempt',
      jsonb_build_object(
        'attempted_by', auth.uid(),
        'attempted_by_role', current_user_role,
        'target_user_id', target_user_id,
        'timestamp', now(),
        'reason', 'admin_already_exists_and_caller_not_admin'
      )
    );
    
    RETURN false;
  END IF;
END;
$function$;

-- 3. Create a function to securely check admin setup status
CREATE OR REPLACE FUNCTION public.check_admin_setup_allowed()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  admin_count integer;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  -- Only allow setup if no admin exists
  RETURN admin_count = 0;
END;
$function$;

-- 4. Add rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (is_admin());

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);