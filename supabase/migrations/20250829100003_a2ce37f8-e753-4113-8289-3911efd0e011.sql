-- Add blog-specific fields to marketing_content table (use IF NOT EXISTS)
ALTER TABLE public.marketing_content
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
ADD COLUMN IF NOT EXISTS content_sections JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Add index for better blog content queries
CREATE INDEX IF NOT EXISTS idx_marketing_content_blog_seo
ON public.marketing_content (platform, status, seo_score, created_at)
WHERE platform = 'blog';
