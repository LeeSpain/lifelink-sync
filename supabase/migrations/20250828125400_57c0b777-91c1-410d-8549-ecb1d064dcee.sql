-- Harden security for leads and video_analytics without breaking functionality

-- 1) Enforce RLS strictly
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics FORCE ROW LEVEL SECURITY;

-- 2) Tighten table grants
-- Leads: block anon entirely; allow authenticated to read/manage (RLS restricts to admins)
REVOKE ALL ON TABLE public.leads FROM anon;
GRANT SELECT, UPDATE, DELETE ON TABLE public.leads TO authenticated;
-- (INSERTs are performed by service role in edge functions; no need to grant to clients)

-- Video analytics: allow public inserts for tracking, but restrict reads to authenticated only (admin via RLS)
REVOKE ALL ON TABLE public.video_analytics FROM anon, authenticated;
GRANT INSERT ON TABLE public.video_analytics TO anon, authenticated;
GRANT SELECT ON TABLE public.video_analytics TO authenticated;

-- 3) Ensure admin-only read/manage policies exist (idempotent)
DO $$
BEGIN
  -- Leads policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Admin can read leads'
  ) THEN
    CREATE POLICY "Admin can read leads"
    ON public.leads
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Admins can manage leads'
  ) THEN
    CREATE POLICY "Admins can manage leads"
    ON public.leads
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;

  -- Video analytics policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'video_analytics' AND policyname = 'Admin can view all video analytics'
  ) THEN
    CREATE POLICY "Admin can view all video analytics"
    ON public.video_analytics
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
  END IF;

  -- Ensure insert remains allowed for tracking (both anon and authenticated)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'video_analytics' AND policyname = 'Allow insert for video analytics'
  ) THEN
    CREATE POLICY "Allow insert for video analytics"
    ON public.video_analytics
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END
$$;