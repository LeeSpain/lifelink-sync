-- Security Hardening Migration: Consolidate RLS policies and enhance security monitoring
-- Part 1: Clean up registration_selections table policies

-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Users can manage own selections" ON public.registration_selections;
DROP POLICY IF EXISTS "users_manage_own_selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admins can manage all registration selections" ON public.registration_selections;

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