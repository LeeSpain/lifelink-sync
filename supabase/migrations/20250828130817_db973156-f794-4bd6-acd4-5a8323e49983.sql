-- Security fixes migration
-- Fix 1: Remove anonymous video analytics access (require authentication)
DROP POLICY IF EXISTS "Allow insert for video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "System can insert video analytics" ON public.video_analytics;

-- Only allow authenticated users to insert video analytics
CREATE POLICY "Authenticated users can insert video analytics"
ON public.video_analytics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Add Gmail token encryption audit log
CREATE TABLE IF NOT EXISTS public.gmail_token_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the audit log
ALTER TABLE public.gmail_token_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view token access logs
CREATE POLICY "Admin can view gmail token access logs"
ON public.gmail_token_access_log
FOR SELECT
USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert gmail token access logs"
ON public.gmail_token_access_log
FOR INSERT
WITH CHECK (true);

-- Fix 3: Add trigger for Gmail token access logging
CREATE OR REPLACE FUNCTION public.log_gmail_token_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log token access attempts
  INSERT INTO public.gmail_token_access_log (
    user_id,
    action,
    ip_address,
    user_agent
  )
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'x-forwarded-for' THEN
        (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet
      ELSE NULL
    END,
    CASE 
      WHEN current_setting('request.headers', true)::json ? 'user-agent' THEN
        current_setting('request.headers', true)::json->>'user-agent'
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger to gmail_tokens table
DROP TRIGGER IF EXISTS gmail_token_access_trigger ON public.gmail_tokens;
CREATE TRIGGER gmail_token_access_trigger
  AFTER SELECT OR UPDATE OR DELETE
  ON public.gmail_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.log_gmail_token_access();

-- Fix 4: Enhanced rate limiting for critical operations
UPDATE public.rate_limits 
SET max_attempts = 3 
WHERE action_type = 'password_reset';

-- Fix 5: Strengthen phone verification security
-- Add additional validation trigger for phone verifications
CREATE OR REPLACE FUNCTION public.validate_phone_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Ensure user owns the phone verification
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot create verification for another user';
  END IF;
  
  -- Limit verification attempts per phone number
  IF (
    SELECT COUNT(*) 
    FROM public.phone_verifications 
    WHERE phone_number = NEW.phone_number 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many verification attempts for this phone number';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger
DROP TRIGGER IF EXISTS phone_verification_validation_trigger ON public.phone_verifications;
CREATE TRIGGER phone_verification_validation_trigger
  BEFORE INSERT
  ON public.phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phone_verification();