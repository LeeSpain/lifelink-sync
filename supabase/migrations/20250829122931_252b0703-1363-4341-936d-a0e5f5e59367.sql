-- Handle registration_selections table security
-- Check if registration_selections table exists and secure it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' AND tablename = 'registration_selections'
  ) THEN
    -- Enforce RLS
    EXECUTE 'ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.registration_selections FORCE ROW LEVEL SECURITY';

    -- Drop any overly permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "Public can read registration selections" ON public.registration_selections';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view registration selections" ON public.registration_selections';

    -- Admin-only read access
    EXECUTE 'CREATE POLICY "Admins can read registration selections"
      ON public.registration_selections
      FOR SELECT
      USING (public.is_admin())';

    -- Users can only insert their own data
    EXECUTE 'CREATE POLICY "Users can create own registration selections"
      ON public.registration_selections
      FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL)';

    -- Admin management
    EXECUTE 'CREATE POLICY "Admins can manage registration selections"
      ON public.registration_selections
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';
  END IF;
END
$$;

-- Handle phone_verifications table security
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' AND tablename = 'phone_verifications'
  ) THEN
    -- Enforce RLS
    EXECUTE 'ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY';

    -- Clean up existing overly permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "Public can read phone verifications" ON public.phone_verifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their phone verifications" ON public.phone_verifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage phone verifications" ON public.phone_verifications';

    -- Service role read-only (no client reads)
    EXECUTE 'CREATE POLICY "Service role can read phone verifications"
      ON public.phone_verifications
      FOR SELECT
      USING (auth.role() = ''service_role'')';

    -- Users can only INSERT their own records
    EXECUTE 'CREATE POLICY "Users can create own phone verifications"
      ON public.phone_verifications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';

    -- Attach validation trigger if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'validate_phone_verification_trigger'
    ) THEN
      EXECUTE 'CREATE TRIGGER validate_phone_verification_trigger
        BEFORE INSERT ON public.phone_verifications
        FOR EACH ROW EXECUTE FUNCTION public.validate_phone_verification()';
    END IF;
  END IF;
END
$$;