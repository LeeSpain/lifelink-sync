-- Create blog_posts table for published blog content
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.marketing_content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  featured_image_alt TEXT,
  seo_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  reading_time INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_media_accounts table for OAuth connections
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_name TEXT,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  follower_count INTEGER DEFAULT 0,
  connection_status TEXT NOT NULL DEFAULT 'connected',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS on new tables if not already enabled
DO $$ 
BEGIN
  ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admin can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can manage their own social media accounts" ON public.social_media_accounts;
DROP POLICY IF EXISTS "Admin can view all social media accounts" ON public.social_media_accounts;

-- RLS policies for blog_posts
CREATE POLICY "Admin can manage blog posts" 
ON public.blog_posts FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view published blog posts" 
ON public.blog_posts FOR SELECT 
USING (status = 'published');

-- RLS policies for social_media_accounts
CREATE POLICY "Users can manage their own social media accounts" 
ON public.social_media_accounts FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all social media accounts" 
ON public.social_media_accounts FOR SELECT 
USING (is_admin());

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
DROP TRIGGER IF EXISTS update_social_media_accounts_updated_at ON public.social_media_accounts;

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_user_platform ON public.social_media_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_status ON public.social_media_accounts(connection_status);