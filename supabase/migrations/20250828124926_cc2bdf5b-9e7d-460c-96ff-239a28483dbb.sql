-- Tighten security for contact_submissions: enforce RLS and admin-only read

-- 1) Ensure RLS is enabled and enforced
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

-- 2) Restrict grants to avoid accidental exposure; allow inserts only (reads controlled by RLS)
REVOKE ALL ON TABLE public.contact_submissions FROM anon;
REVOKE ALL ON TABLE public.contact_submissions FROM authenticated;
GRANT INSERT ON TABLE public.contact_submissions TO anon, authenticated;

-- 3) Create admin-only SELECT/UPDATE/DELETE policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admin can read contact submissions'
  ) THEN
    CREATE POLICY "Admin can read contact submissions"
    ON public.contact_submissions
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admin can update contact submissions'
  ) THEN
    CREATE POLICY "Admin can update contact submissions"
    ON public.contact_submissions
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admin can delete contact submissions'
  ) THEN
    CREATE POLICY "Admin can delete contact submissions"
    ON public.contact_submissions
    FOR DELETE
    TO authenticated
    USING (public.is_admin());
  END IF;
END
$$;

-- Note: Existing INSERT policies (rate limited + system insert) remain unchanged to avoid breaking form submissions.