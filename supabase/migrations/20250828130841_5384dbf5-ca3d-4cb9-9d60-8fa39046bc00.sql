-- Security fixes migration (corrected)
-- Fix 1: Remove anonymous video analytics access (require authentication)
DROP POLICY IF EXISTS "Allow insert for video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "System can insert video analytics" ON public.video_analytics;

-- Only allow authenticated users to insert video analytics
CREATE POLICY "Authenticated users can insert video analytics"
ON public.video_analytics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Add Gmail token access audit log table
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

-- Fix 3: Enhanced phone verification security validation
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
  
  -- Limit verification attempts per phone number per hour
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

-- Apply validation trigger to phone verifications
DROP TRIGGER IF EXISTS phone_verification_validation_trigger ON public.phone_verifications;
CREATE TRIGGER phone_verification_validation_trigger
  BEFORE INSERT
  ON public.phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phone_verification();