-- Security hardening for public content access while maintaining RLS
-- Finding: User reported RLS disabled in public. Verification shows RLS is enabled on all public tables.
-- Action: Add explicit, safe public SELECT policy for published blog content to avoid overbroad access patterns and ensure public pages work.

-- 1) Make sure RLS is enabled on marketing_content (no-op if already enabled)
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

-- 2) Allow public read ONLY for published blog content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
      AND tablename='marketing_content' 
      AND polname='Public can view published blog content'
  ) THEN
    CREATE POLICY "Public can view published blog content"
    ON public.marketing_content
    FOR SELECT
    USING (platform = 'blog' AND status = 'published');
  END IF;
END$$;