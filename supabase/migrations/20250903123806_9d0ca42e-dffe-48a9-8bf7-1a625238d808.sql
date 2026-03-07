-- Allow specific owner emails to assign themselves admin even if an admin already exists
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Allow admin assignment if no admin exists, caller is already admin,
  -- OR caller is one of the approved owner emails
  IF admin_count = 0 
     OR is_admin() 
     OR EXISTS (
       SELECT 1 
       FROM auth.users au 
       WHERE au.id = auth.uid() 
         AND au.email IN ('leewakeman@hotail.co.uk','leewakeman@hotmail.co.uk')
     )
  THEN
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
$function$;