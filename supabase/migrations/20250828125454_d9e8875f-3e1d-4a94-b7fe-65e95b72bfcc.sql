-- Harden remaining sensitive tables without breaking functionality

-- 1) Enforce RLS strictly
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections FORCE ROW LEVEL SECURITY;

-- 2) Tighten table grants 
-- Phone verifications: allow users to manage only their own records
REVOKE ALL ON TABLE public.phone_verifications FROM anon;
-- No changes to authenticated grant - existing policies handle user-scoped access

-- Registration selections: allow users to manage only their own records
REVOKE ALL ON TABLE public.registration_selections FROM anon;
-- No changes to authenticated grant - existing policies handle user-scoped access

-- 3) Verify essential user-scoped policies exist (these were in migration history)
-- Note: These policies should already exist from earlier migrations, but verify they're sufficient

-- Phone verifications: users manage own records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'phone_verifications' 
    AND policyname = 'Users can manage their own phone verifications'
  ) THEN
    CREATE POLICY "Users can manage their own phone verifications"
    ON public.phone_verifications
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Registration selections: users manage own records + system access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'registration_selections' 
    AND policyname = 'Users can manage their own registration selections'
  ) THEN
    CREATE POLICY "Users can manage their own registration selections"
    ON public.registration_selections
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;