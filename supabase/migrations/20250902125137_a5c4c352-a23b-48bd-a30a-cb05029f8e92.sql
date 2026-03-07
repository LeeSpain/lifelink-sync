-- Security Hardening Migration: Consolidate RLS policies and enhance security monitoring
-- Part 1: Clean up registration_selections table policies

-- First, let's see what policies exist on registration_selections
DO $$
BEGIN
  -- Drop any duplicate or overly broad policies on registration_selections
  DROP POLICY IF EXISTS "Users can view their own selections" ON public.registration_selections;
  DROP POLICY IF EXISTS "Users can manage own selections" ON public.registration_selections;
  DROP POLICY IF EXISTS "users_manage_own_selections" ON public.registration_selections;
  
  -- Create consolidated, secure policy for registration_selections
  CREATE POLICY "Users manage own registration selections"
    ON public.registration_selections
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  -- Admin access policy
  CREATE POLICY "Admins can manage all registration selections"
    ON public.registration_selections
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
END $$;

-- Part 2: Enhanced Security Event Logging
-- Add new security event types and improve tracking
ALTER TABLE public.security_events 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS source_component TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- Create index for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_security_events_user_created 
  ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity 
  ON public.security_events(event_type, severity, created_at DESC);

-- Part 3: Create table for tracking authentication failures
CREATE TABLE IF NOT EXISTS public.auth_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on auth_failures
ALTER TABLE public.auth_failures ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth failures
CREATE POLICY "Admins can view auth failures"
  ON public.auth_failures
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- System can insert auth failures
CREATE POLICY "System can insert auth failures"
  ON public.auth_failures
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Index for auth failure lookups
CREATE INDEX IF NOT EXISTS idx_auth_failures_email_ip 
  ON public.auth_failures(email, ip_address, last_attempt_at DESC);

-- Part 4: Enhanced security audit logging function
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

-- Part 5: Function to track and block repeated auth failures
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