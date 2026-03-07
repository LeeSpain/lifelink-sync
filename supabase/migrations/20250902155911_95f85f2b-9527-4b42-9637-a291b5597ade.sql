-- Secure phone_verifications RLS and policies
-- 1) Ensure RLS is enabled and remove any overly-permissive existing policies
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'phone_verifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.phone_verifications', pol.policyname);
  END LOOP;
END $$;

-- 2) Restrictive, least-privilege policies
CREATE POLICY "Users can view their own phone verifications"
ON public.phone_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone verifications"
ON public.phone_verifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Intentionally omit DELETE (only service_role can delete when needed)

-- 3) Optional: add an index for performance on user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_phone_verifications_user_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_phone_verifications_user_id ON public.phone_verifications(user_id);
  END IF;
END $$;