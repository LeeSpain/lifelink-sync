-- Create marketing_content table to store generated posts/articles
CREATE TABLE IF NOT EXISTS public.marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  hashtags TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_time TIMESTAMPTZ,
  seo_title TEXT,
  meta_description TEXT,
  slug TEXT,
  keywords TEXT[],
  featured_image_alt TEXT,
  content_sections JSONB,
  reading_time INTEGER,
  seo_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

-- Admin-only policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketing_content' AND policyname = 'Admin can manage marketing content'
  ) THEN
    CREATE POLICY "Admin can manage marketing content"
    ON public.marketing_content
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_content_campaign_id ON public.marketing_content (campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_status ON public.marketing_content (status);
CREATE INDEX IF NOT EXISTS idx_marketing_content_platform ON public.marketing_content (platform);

-- Trigger to keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_marketing_content_updated_at'
  ) THEN
    CREATE TRIGGER trg_marketing_content_updated_at
    BEFORE UPDATE ON public.marketing_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;