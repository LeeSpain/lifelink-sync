-- Harden access to public.phone_verifications and prevent exposure of phone numbers and verification codes

-- 1) Ensure RLS is enabled
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly broad user policy that allowed SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'phone_verifications' 
      AND policyname = 'users_manage_own_phone_verifications'
  ) THEN
    EXECUTE 'DROP POLICY "users_manage_own_phone_verifications" ON public.phone_verifications';
  END IF;
END $$;

-- 3) Create least-privilege policies (no SELECT for end users)
-- Users: can insert/update/delete only their own rows
CREATE POLICY "Users can insert own phone verifications"
  ON public.phone_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone verifications"
  ON public.phone_verifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone verifications"
  ON public.phone_verifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role: can fully manage for server-side flows (including SELECT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'phone_verifications' 
      AND policyname = 'Service role can manage phone verifications'
  ) THEN
    -- keep existing service role policy as-is
    NULL;
  ELSE
    CREATE POLICY "Service role can manage phone verifications"
      ON public.phone_verifications
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 4) Strengthen schema: ensure user_id is always present to make RLS effective
ALTER TABLE public.phone_verifications 
  ALTER COLUMN user_id SET NOT NULL;

-- 5) Optional hardening (no-op if already present): restrict public SELECT by absence of policy
-- With no SELECT policy for end-users, clients cannot read any verification rows, 
-- preventing exposure of phone numbers and verification codes.
