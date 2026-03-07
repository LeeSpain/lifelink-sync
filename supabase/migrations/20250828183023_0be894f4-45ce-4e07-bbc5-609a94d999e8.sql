-- Create marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  command_input TEXT NOT NULL,
  target_audience JSONB DEFAULT '{}',
  budget_estimate NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing content table
CREATE TABLE public.marketing_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  body_text TEXT,
  image_url TEXT,
  hashtags TEXT[],
  scheduled_time TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social media accounts table
CREATE TABLE public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT,
  is_active BOOLEAN DEFAULT true,
  last_connected TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing analytics table
CREATE TABLE public.marketing_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_campaigns
CREATE POLICY "Admin can manage marketing campaigns"
ON public.marketing_campaigns
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for marketing_content
CREATE POLICY "Admin can manage marketing content"
ON public.marketing_content
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for social_media_accounts
CREATE POLICY "Admin can manage social media accounts"
ON public.social_media_accounts
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for marketing_analytics
CREATE POLICY "Admin can view marketing analytics"
ON public.marketing_analytics
FOR SELECT
USING (is_admin());

CREATE POLICY "System can insert marketing analytics"
ON public.marketing_analytics
FOR INSERT
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_content_updated_at
BEFORE UPDATE ON public.marketing_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_accounts_updated_at
BEFORE UPDATE ON public.social_media_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();