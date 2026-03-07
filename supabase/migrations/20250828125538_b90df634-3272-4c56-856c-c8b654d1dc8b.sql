-- Secure the remaining exposed tables: phone_verifications and registration_selections

-- 1) Phone verifications: ensure user-only access (already partially secured but check)
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY;

-- 2) Registration selections: ensure user-only access
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections FORCE ROW LEVEL SECURITY;

-- 3) Tighten grants - these should only be accessible to authenticated users for their own data
REVOKE ALL ON TABLE public.phone_verifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.phone_verifications TO authenticated;

REVOKE ALL ON TABLE public.registration_selections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.registration_selections TO authenticated;

-- 4) Ensure user-only policies exist and are comprehensive
DO $$
BEGIN
  -- Phone verifications: users can only access their own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'phone_verifications' AND policyname = 'Users can only access own phone verifications'
  ) THEN
    CREATE POLICY "Users can only access own phone verifications"
    ON public.phone_verifications
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Registration selections: users can only access their own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'registration_selections' AND policyname = 'Users can only access own registration selections'
  ) THEN
    CREATE POLICY "Users can only access own registration selections"
    ON public.registration_selections
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;