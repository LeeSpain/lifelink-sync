-- Fix social media accounts table and add missing tables for Riven AI
-- Create social media OAuth integrations table
CREATE TABLE IF NOT EXISTS public.social_media_oauth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  platform_username TEXT,
  platform_name TEXT,
  follower_count INTEGER DEFAULT 0,
  connection_status TEXT NOT NULL DEFAULT 'active',
  permissions JSONB DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Enable RLS
ALTER TABLE public.social_media_oauth ENABLE ROW LEVEL SECURITY;

-- Create policies for social media OAuth
CREATE POLICY "Admin can manage all social media OAuth" 
ON public.social_media_oauth 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can manage their own social media OAuth" 
ON public.social_media_oauth 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create content generation requests table if not exists
CREATE TABLE IF NOT EXISTS public.content_generation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generated_content TEXT,
  generated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for content generation requests
ALTER TABLE public.content_generation_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for content generation requests
CREATE POLICY "Admin can manage all content generation requests" 
ON public.content_generation_requests 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create social media posting queue
CREATE TABLE IF NOT EXISTS public.social_media_posting_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  platform TEXT NOT NULL,
  oauth_account_id UUID,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  platform_post_id TEXT,
  engagement_metrics JSONB DEFAULT '{}'::jsonb,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'scheduled',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for social media posting queue
ALTER TABLE public.social_media_posting_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for social media posting queue
CREATE POLICY "Admin can manage social media posting queue" 
ON public.social_media_posting_queue 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create engagement tracking table
CREATE TABLE IF NOT EXISTS public.social_media_engagement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- likes, shares, comments, clicks, impressions
  metric_value INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for engagement tracking
ALTER TABLE public.social_media_engagement ENABLE ROW LEVEL SECURITY;

-- Create policies for engagement tracking
CREATE POLICY "Admin can view all engagement data" 
ON public.social_media_engagement 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "System can insert engagement data" 
ON public.social_media_engagement 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_social_media_oauth_updated_at
  BEFORE UPDATE ON public.social_media_oauth
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_generation_requests_updated_at
  BEFORE UPDATE ON public.content_generation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_posting_queue_updated_at
  BEFORE UPDATE ON public.social_media_posting_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();