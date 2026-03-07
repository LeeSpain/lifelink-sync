-- Fix migration - remove problematic index reference
-- Add missing tables for complete Riven AI Marketing system

-- Social media platform authentication and management
CREATE TABLE IF NOT EXISTS public.social_platform_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  client_id TEXT,
  client_secret TEXT,
  webhook_url TEXT,
  api_version TEXT DEFAULT 'v1',
  rate_limits JSONB DEFAULT '{"posts_per_hour": 10, "posts_per_day": 100}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced social media accounts with OAuth tokens
ALTER TABLE public.social_media_accounts 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS page_id TEXT,
ADD COLUMN IF NOT EXISTS page_name TEXT,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_user_id TEXT,
ADD COLUMN IF NOT EXISTS oauth_state TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Content generation requests and results
CREATE TABLE IF NOT EXISTS public.content_generation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  content_type TEXT NOT NULL, -- 'text', 'image', 'video_script'
  platform TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generated_content TEXT,
  generated_image_url TEXT,
  generation_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Social media post analytics
CREATE TABLE IF NOT EXISTS public.social_media_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.marketing_content(id),
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cost_per_engagement NUMERIC DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_date DATE DEFAULT CURRENT_DATE,
  raw_analytics_data JSONB DEFAULT '{}'
);

-- Campaign performance tracking
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  total_impressions INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_spend NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  cost_per_click NUMERIC DEFAULT 0,
  cost_per_conversion NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- A/B testing for content variations
CREATE TABLE IF NOT EXISTS public.content_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  test_name TEXT NOT NULL,
  variant_a_content_id UUID REFERENCES public.marketing_content(id),
  variant_b_content_id UUID REFERENCES public.marketing_content(id),
  traffic_split NUMERIC DEFAULT 50, -- percentage for variant A
  status TEXT DEFAULT 'running', -- 'running', 'paused', 'completed'
  winner_variant TEXT, -- 'a', 'b', 'inconclusive'
  confidence_level NUMERIC DEFAULT 0,
  statistical_significance BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Content moderation and approval
CREATE TABLE IF NOT EXISTS public.content_moderation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.marketing_content(id),
  moderation_type TEXT NOT NULL, -- 'brand_safety', 'policy_compliance', 'sentiment'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'
  confidence_score NUMERIC DEFAULT 0,
  flagged_reasons TEXT[],
  moderated_by UUID, -- user_id who reviewed
  moderated_at TIMESTAMP WITH TIME ZONE,
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor analysis tracking
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  competitor_handle TEXT NOT NULL,
  follower_count INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC DEFAULT 0,
  posting_frequency NUMERIC DEFAULT 0, -- posts per day
  top_content_types TEXT[],
  trending_hashtags TEXT[],
  analysis_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.social_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage platform configs" ON public.social_platform_configs 
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can manage content generation" ON public.content_generation_requests 
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can view analytics" ON public.social_media_analytics 
FOR SELECT USING (is_admin());

CREATE POLICY "System can insert analytics" ON public.social_media_analytics 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view campaign analytics" ON public.campaign_analytics 
FOR SELECT USING (is_admin());

CREATE POLICY "System can manage campaign analytics" ON public.campaign_analytics 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin can manage AB tests" ON public.content_ab_tests 
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can manage content moderation" ON public.content_moderation 
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can view competitor analysis" ON public.competitor_analysis 
FOR SELECT USING (is_admin());

CREATE POLICY "System can manage competitor analysis" ON public.competitor_analysis 
FOR INSERT WITH CHECK (true);