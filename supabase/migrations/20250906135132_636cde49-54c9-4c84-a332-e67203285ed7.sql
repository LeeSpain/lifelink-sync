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

-- Create email_campaigns table for email marketing
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.marketing_content(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  target_segments TEXT[] DEFAULT ARRAY['all'],
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
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

-- Enable RLS on new tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_posts
CREATE POLICY "Admin can manage blog posts" 
ON public.blog_posts FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view published blog posts" 
ON public.blog_posts FOR SELECT 
USING (status = 'published');

-- RLS policies for email_campaigns
CREATE POLICY "Admin can manage email campaigns" 
ON public.email_campaigns FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- RLS policies for social_media_accounts
CREATE POLICY "Users can manage their own social media accounts" 
ON public.social_media_accounts FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all social media accounts" 
ON public.social_media_accounts FOR SELECT 
USING (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at);

CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled_at ON public.email_campaigns(scheduled_at);

CREATE INDEX idx_social_media_accounts_user_platform ON public.social_media_accounts(user_id, platform);
CREATE INDEX idx_social_media_accounts_status ON public.social_media_accounts(connection_status);