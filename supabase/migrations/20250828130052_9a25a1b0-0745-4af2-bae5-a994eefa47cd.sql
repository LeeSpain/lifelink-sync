-- Fix INSERT policy: only WITH CHECK is allowed for INSERT
-- Also ensure admin policies exist; do not alter grants

-- 1) Create strict service-role-only INSERT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Service role can insert contact submissions'
  ) THEN
    DROP POLICY "Service role can insert contact submissions" ON public.contact_submissions;
  END IF;

  CREATE POLICY "Service role can insert contact submissions"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
END
$$;

-- 2) Ensure admin-only read/update/delete policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Admin can read contact submissions'
  ) THEN
    CREATE POLICY "Admin can read contact submissions"
    ON public.contact_submissions
    FOR SELECT
    USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Admin can update contact submissions'
  ) THEN
    CREATE POLICY "Admin can update contact submissions"
    ON public.contact_submissions
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Admin can delete contact submissions'
  ) THEN
    CREATE POLICY "Admin can delete contact submissions"
    ON public.contact_submissions
    FOR DELETE
    USING (public.is_admin());
  END IF;
END
$$;