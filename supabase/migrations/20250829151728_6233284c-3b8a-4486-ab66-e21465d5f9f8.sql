-- Secure phone_verifications table: restrict access to service role only
BEGIN;

-- Ensure RLS is enabled and enforced
ALTER TABLE IF EXISTS public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phone_verifications FORCE ROW LEVEL SECURITY;

-- Revoke any direct privileges from anon/authenticated roles
REVOKE ALL ON TABLE public.phone_verifications FROM anon;
REVOKE ALL ON TABLE public.phone_verifications FROM authenticated;

-- Drop user-insert policy if present (we don't want clients inserting rows directly)
DROP POLICY IF EXISTS "Users can create own phone verifications" ON public.phone_verifications;

-- Drop redundant read-only policy as the ALL policy already covers SELECT
DROP POLICY IF EXISTS "Service role can read phone verifications" ON public.phone_verifications;

-- Ensure a strict service-role-only policy exists for all actions
CREATE POLICY "Service role can manage phone verifications"
ON public.phone_verifications
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Safety: comment to document intent
COMMENT ON TABLE public.phone_verifications IS 'Contains phone numbers and verification codes. Access restricted to service role via RLS.';

COMMIT;