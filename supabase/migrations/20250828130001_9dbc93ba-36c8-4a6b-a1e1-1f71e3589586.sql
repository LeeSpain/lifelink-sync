-- Harden contact_submissions RLS so only admins can read/manage and only service role can insert
-- 1) Ensure RLS is enabled and forced
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

-- 2) Remove overly-permissive or redundant insert policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'System can insert contact submissions'
  ) THEN
    DROP POLICY "System can insert contact submissions" ON public.contact_submissions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Rate limited contact submissions'
  ) THEN
    DROP POLICY "Rate limited contact submissions" ON public.contact_submissions;
  END IF;
END
$$;

-- 3) Recreate a strict service-role-only insert policy (edge functions use service role and bypass RLS, but this is explicit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Service role can insert contact submissions'
  ) THEN
    CREATE POLICY "Service role can insert contact submissions"
    ON public.contact_submissions
    FOR INSERT
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

-- 4) Ensure admin-only access for reads and management (create if missing)
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

-- 5) Optional: tighten grants (not required by Supabase since RLS governs access), kept explicit for clarity
REVOKE ALL ON TABLE public.contact_submissions FROM anon;
REVOKE ALL ON TABLE public.contact_submissions FROM authenticated;