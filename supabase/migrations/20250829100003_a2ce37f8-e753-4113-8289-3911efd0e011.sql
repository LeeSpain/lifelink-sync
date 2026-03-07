-- Add blog-specific fields to marketing_content table
ALTER TABLE public.marketing_content 
ADD COLUMN seo_title TEXT,
ADD COLUMN meta_description TEXT,
ADD COLUMN slug TEXT,
ADD COLUMN keywords TEXT[],
ADD COLUMN featured_image_alt TEXT,
ADD COLUMN content_sections JSONB DEFAULT '{}',
ADD COLUMN reading_time INTEGER DEFAULT 0,
ADD COLUMN seo_score INTEGER DEFAULT 0;

-- Add index for better blog content queries
CREATE INDEX idx_marketing_content_blog_seo 
ON public.marketing_content (platform, status, seo_score, created_at) 
WHERE platform = 'blog';