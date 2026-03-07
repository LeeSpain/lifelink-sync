-- Secure phone_verifications table: restrict access to service role only
BEGIN;

-- Ensure RLS is enabled and enforced
ALTER TABLE IF EXISTS public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phone_verifications FORCE ROW LEVEL SECURITY;

-- Revoke any direct privileges from anon/authenticated roles
REVOKE ALL ON TABLE public.phone_verifications FROM anon;
REVOKE ALL ON TABLE public.phone_verifications FROM authenticated;

-- Drop user-insert policy if present (we don't want clients inserting rows directly)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'phone_verifications' 
      AND policyname = 'Users can create own phone verifications'
  ) THEN
    EXECUTE 'DROP POLICY "Users can create own phone verifications" ON public.phone_verifications';
  END IF;
END$$;

-- Optional cleanup: the ALL policy already covers SELECT, so remove redundant read-only policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'phone_verifications' 
      AND policyname = 'Service role can read phone verifications'
  ) THEN
    EXECUTE 'DROP POLICY "Service role can read phone verifications" ON public.phone_verifications';
  END IF;
END$$;

-- Ensure a strict service-role-only policy exists for all actions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'phone_verifications' 
      AND policyname = 'Service role can manage phone verifications'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Service role can manage phone verifications"
      ON public.phone_verifications
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
    $$;
  END IF;
END$$;

-- Safety: comment to document intent
COMMENT ON TABLE public.phone_verifications IS 'Contains phone numbers and verification codes. Access restricted to service role via RLS.';

COMMIT;