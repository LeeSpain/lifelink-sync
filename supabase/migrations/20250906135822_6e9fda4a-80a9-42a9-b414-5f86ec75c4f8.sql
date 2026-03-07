-- Phase 1: Database & Schema Fixes (Critical)
-- Idempotent migration to ensure required tables, policies, triggers, and indexes exist and are aligned

begin;

-- 1) BLOG POSTS TABLE
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
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist in case table pre-existed without them
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS content_id UUID,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS featured_image TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Constraints that might be missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_blog_posts_slug'
  ) THEN
    CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_blog_posts_status'
  ) THEN
    CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_blog_posts_published_at'
  ) THEN
    CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at);
  END IF;
END $$;

-- Enable RLS and re-create policies for determinism
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admin can manage blog posts" 
ON public.blog_posts FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog posts" 
ON public.blog_posts FOR SELECT 
USING (status = 'published');

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 2) SOCIAL MEDIA ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_name TEXT,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  connection_status TEXT NOT NULL DEFAULT 'connected',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Ensure required columns exist (reconciling inconsistencies)
ALTER TABLE public.social_media_accounts
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS platform_user_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_name TEXT,
  ADD COLUMN IF NOT EXISTS platform_username TEXT,
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'connected',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Indexes for performance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_social_media_accounts_user_platform'
  ) THEN
    CREATE INDEX idx_social_media_accounts_user_platform ON public.social_media_accounts(user_id, platform);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_social_media_accounts_status'
  ) THEN
    CREATE INDEX idx_social_media_accounts_status ON public.social_media_accounts(connection_status);
  END IF;
END $$;

-- Enable RLS and policies
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own social media accounts" ON public.social_media_accounts;
CREATE POLICY "Users can manage their own social media accounts" 
ON public.social_media_accounts FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all social media accounts" ON public.social_media_accounts;
CREATE POLICY "Admin can view all social media accounts" 
ON public.social_media_accounts FOR SELECT 
USING (is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS update_social_media_accounts_updated_at ON public.social_media_accounts;
CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

commit;