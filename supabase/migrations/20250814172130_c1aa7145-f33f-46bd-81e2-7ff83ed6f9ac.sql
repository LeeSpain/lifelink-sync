-- Fix critical privilege escalation vulnerability in profiles table
-- Remove ability for users to update their own role
DROP POLICY IF EXISTS "Users can update their own profile (excluding role)" ON public.profiles;

-- Create secure policy that prevents role updates by users
CREATE POLICY "Users can update their own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Fix admin setup race condition with atomic operation
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count integer;
  current_user_role text;
  update_count integer;
BEGIN
  -- Use table lock to prevent race conditions
  LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;
  
  -- Check if any admin exists with atomic operation
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
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count > 0 THEN
      -- Enhanced logging for admin assignment
      INSERT INTO public.security_audit_log (
        user_id, 
        action, 
        resource_type, 
        resource_id, 
        metadata,
        ip_address
      )
      VALUES (
        target_user_id, 
        'admin_role_assigned', 
        'user_role',
        target_user_id::text,
        jsonb_build_object(
          'assigned_by', auth.uid(),
          'assigned_by_role', current_user_role,
          'timestamp', now(),
          'was_initial_setup', admin_count = 0,
          'target_user_id', target_user_id
        ),
        CASE 
          WHEN current_setting('request.headers', true)::json ? 'x-forwarded-for' THEN
            (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet
          ELSE NULL
        END
      );
      
      RETURN true;
    END IF;
  ELSE
    -- Log unauthorized attempt
    INSERT INTO public.security_audit_log (
      user_id, 
      action, 
      resource_type, 
      resource_id, 
      metadata,
      ip_address
    )
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
      'admin_role_assignment_denied', 
      'user_role',
      target_user_id::text,
      jsonb_build_object(
        'attempted_by', auth.uid(),
        'attempted_by_role', current_user_role,
        'target_user_id', target_user_id,
        'timestamp', now(),
        'reason', 'admin_already_exists_and_caller_not_admin'
      ),
      CASE 
        WHEN current_setting('request.headers', true)::json ? 'x-forwarded-for' THEN
          (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet
        ELSE NULL
      END
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Add rate limiting to contact submissions
CREATE POLICY "Rate limited contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (
  -- Allow max 3 submissions per IP per hour
  (
    SELECT COUNT(*) 
    FROM public.contact_submissions 
    WHERE ip_address = (current_setting('request.headers', true)::json->>'x-forwarded-for')
    AND created_at > now() - interval '1 hour'
  ) < 3
);

-- Add comprehensive security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    metadata,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_metadata,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'x-forwarded-for' THEN
        current_setting('request.headers', true)::json->>'x-forwarded-for'
      ELSE NULL
    END,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'user-agent' THEN
        current_setting('request.headers', true)::json->>'user-agent'
      ELSE NULL
    END,
    now()
  );
END;
$$;