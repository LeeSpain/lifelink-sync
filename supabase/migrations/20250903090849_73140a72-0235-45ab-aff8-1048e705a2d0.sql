-- Priority 1 Security Hardening: RLS and Policies for sensitive tables
-- 1) Secure auth_failures table
DO $$
BEGIN
  -- Enable RLS
  EXECUTE 'ALTER TABLE public.auth_failures ENABLE ROW LEVEL SECURITY';

  -- Admin can view auth failures
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'auth_failures' AND policyname = 'Admin can view auth failures'
  ) THEN
    CREATE POLICY "Admin can view auth failures" ON public.auth_failures
    FOR SELECT
    USING (is_admin());
  END IF;

  -- Service role can read auth failures (used by auth-security-monitor function)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'auth_failures' AND policyname = 'Service can read auth failures'
  ) THEN
    CREATE POLICY "Service can read auth failures" ON public.auth_failures
    FOR SELECT
    USING (auth.role() = 'service_role');
  END IF;

  -- Service role can insert/update auth failures via RPC/function
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'auth_failures' AND policyname = 'Service can insert auth failures'
  ) THEN
    CREATE POLICY "Service can insert auth failures" ON public.auth_failures
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'auth_failures' AND policyname = 'Service can update auth failures'
  ) THEN
    CREATE POLICY "Service can update auth failures" ON public.auth_failures
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 2) Secure registration_selections table
DO $$
BEGIN
  -- Enable RLS
  EXECUTE 'ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY';

  -- Users can view their own records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'registration_selections' AND policyname = 'Users can view own registration selections'
  ) THEN
    CREATE POLICY "Users can view own registration selections" ON public.registration_selections
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Admins can manage everything
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'registration_selections' AND policyname = 'Admins can manage registration selections'
  ) THEN
    CREATE POLICY "Admins can manage registration selections" ON public.registration_selections
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;

  -- Service role (edge functions) can manage records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'registration_selections' AND policyname = 'Service can manage registration selections'
  ) THEN
    CREATE POLICY "Service can manage registration selections" ON public.registration_selections
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
