-- Enhanced security functions and database cleanup migration

-- Part 1: Enhanced security audit logging function
CREATE OR REPLACE FUNCTION public.log_enhanced_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_source_component TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_risk_score INTEGER DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    source_component,
    metadata,
    risk_score,
    ip_address,
    user_agent,
    session_id,
    created_at
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_severity,
    p_source_component,
    p_metadata,
    p_risk_score,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'x-forwarded-for' THEN
        (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet
      ELSE NULL
    END,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'user-agent' THEN
        current_setting('request.headers', true)::json->>'user-agent'
      ELSE NULL
    END,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'x-session-id' THEN
        current_setting('request.headers', true)::json->>'x-session-id'
      ELSE NULL
    END,
    now()
  );
END;
$$;

-- Part 2: Function to track and block repeated auth failures
CREATE OR REPLACE FUNCTION public.track_auth_failure(
  p_email TEXT,
  p_ip_address INET,
  p_failure_reason TEXT,
  p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_failures INTEGER;
  should_block BOOLEAN DEFAULT FALSE;
BEGIN
  -- Insert or update failure record
  INSERT INTO public.auth_failures (
    email, ip_address, failure_reason, user_agent, attempt_count, last_attempt_at
  )
  VALUES (
    p_email, p_ip_address, p_failure_reason, p_user_agent, 1, now()
  )
  ON CONFLICT (email, ip_address) 
  DO UPDATE SET
    attempt_count = auth_failures.attempt_count + 1,
    last_attempt_at = now(),
    failure_reason = p_failure_reason,
    -- Block for 15 minutes after 5 failed attempts
    blocked_until = CASE 
      WHEN auth_failures.attempt_count + 1 >= 5 THEN now() + INTERVAL '15 minutes'
      ELSE auth_failures.blocked_until
    END;

  -- Check if should be blocked
  SELECT attempt_count, (blocked_until > now())
  INTO current_failures, should_block
  FROM public.auth_failures
  WHERE email = p_email AND ip_address = p_ip_address;

  -- Log security event for repeated failures
  IF current_failures >= 3 THEN
    PERFORM public.log_enhanced_security_event(
      NULL,
      'repeated_auth_failure',
      CASE WHEN current_failures >= 5 THEN 'high' ELSE 'medium' END,
      'auth_system',
      jsonb_build_object(
        'email', p_email,
        'ip_address', p_ip_address::text,
        'failure_count', current_failures,
        'failure_reason', p_failure_reason
      ),
      current_failures * 10
    );
  END IF;

  RETURN should_block;
END;
$$;

-- Part 3: Function to clean up old security data (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Clean up old security events (keep 1 year)
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '1 year';
  
  -- Clean up old auth failures (keep 30 days)
  DELETE FROM public.auth_failures 
  WHERE created_at < now() - INTERVAL '30 days';
  
  -- Clean up old video analytics (keep 6 months)
  DELETE FROM public.video_analytics 
  WHERE created_at < now() - INTERVAL '6 months';
  
  -- Log cleanup activity
  PERFORM public.log_enhanced_security_event(
    NULL,
    'security_data_cleanup',
    'low',
    'database_maintenance',
    jsonb_build_object(
      'cleanup_timestamp', now(),
      'retention_policy', 'applied'
    ),
    0
  );
END;
$$;

-- Part 4: Add unique constraint for auth_failures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_email_ip' 
    AND conrelid = 'public.auth_failures'::regclass
  ) THEN
    ALTER TABLE public.auth_failures 
    ADD CONSTRAINT unique_email_ip UNIQUE (email, ip_address);
  END IF;
END $$;