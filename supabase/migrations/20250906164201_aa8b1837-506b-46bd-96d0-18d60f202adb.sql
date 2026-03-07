-- Fix public read policy for published blog content; ensure RLS enforced
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
      AND tablename='marketing_content' 
      AND policyname='Public can view published blog content'
  ) THEN
    CREATE POLICY "Public can view published blog content"
    ON public.marketing_content
    FOR SELECT
    USING (platform = 'blog' AND status = 'published');
  END IF;
END$$;