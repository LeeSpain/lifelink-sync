-- Comprehensive Security Fixes Migration (Final)
-- Addresses critical security vulnerabilities identified in security review

-- 1. Fix phone_verifications RLS policy - remove dangerous NULL user_id condition
DROP POLICY IF EXISTS "Users can manage their own phone verifications" ON public.phone_verifications;

CREATE POLICY "Users can manage their own phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Secure WhatsApp settings - restrict to admin access only
DROP POLICY IF EXISTS "Public can view whatsapp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Admin can manage whatsapp settings" ON public.whatsapp_settings;

CREATE POLICY "Admin can manage whatsapp settings" 
ON public.whatsapp_settings 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- 3. Secure existing whatsapp_accounts table - admin access only
DROP POLICY IF EXISTS "Public can view whatsapp accounts" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Admin can manage whatsapp accounts" ON public.whatsapp_accounts;

-- Enable RLS if not already enabled
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for existing WhatsApp accounts table
CREATE POLICY "Admin can manage whatsapp accounts" 
ON public.whatsapp_accounts 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Add encrypted credentials column to existing table
ALTER TABLE public.whatsapp_accounts 
ADD COLUMN IF NOT EXISTS encrypted_access_token text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 4. Enhanced Gmail token security - add expiry monitoring
ALTER TABLE public.gmail_tokens 
ADD COLUMN IF NOT EXISTS last_refreshed_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS refresh_count integer DEFAULT 0;

-- Add trigger for gmail_tokens to track refresh activity
CREATE OR REPLACE FUNCTION public.track_gmail_token_refresh()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.access_token IS DISTINCT FROM NEW.access_token THEN
        NEW.last_refreshed_at = now();
        NEW.refresh_count = COALESCE(OLD.refresh_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS trigger_track_gmail_token_refresh ON public.gmail_tokens;
CREATE TRIGGER trigger_track_gmail_token_refresh
    BEFORE UPDATE ON public.gmail_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.track_gmail_token_refresh();

-- 5. Security audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
CREATE POLICY "Admin can view security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 6. Add rate limiting table for verification attempts
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL, -- phone number, email, or IP
    action_type text NOT NULL, -- 'phone_verification', 'login_attempt', etc.
    attempt_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    blocked_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(identifier, action_type)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Admin can manage rate limits
CREATE POLICY "Admin can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- System can manage rate limits for enforcement
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 7. Add indexes for performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_expires_at ON public.gmail_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_business_id ON public.whatsapp_accounts(business_account_id);

-- 8. Update triggers for audit logging (check for existing triggers first)
DO $$
BEGIN
    -- Only create triggers if they don't already exist
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_rate_limits_updated_at') THEN
        CREATE TRIGGER update_rate_limits_updated_at
            BEFORE UPDATE ON public.rate_limits
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;

-- Add security comments for documentation
COMMENT ON TABLE public.whatsapp_accounts IS 'WhatsApp Business API accounts - admin access only for security';
COMMENT ON TABLE public.security_audit_log IS 'Security audit trail for sensitive operations';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting for security-sensitive operations';
COMMENT ON COLUMN public.whatsapp_accounts.encrypted_access_token IS 'Encrypted WhatsApp access token for secure storage';
COMMENT ON COLUMN public.whatsapp_accounts.access_token IS 'DEPRECATED: Use encrypted_access_token instead for better security';