-- Create Riven settings table
CREATE TABLE public.riven_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_model TEXT NOT NULL DEFAULT 'gpt-5-2025-08-07',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  brand_voice TEXT DEFAULT 'Professional, caring, safety-focused',
  default_budget NUMERIC DEFAULT 500,
  auto_approve_content BOOLEAN DEFAULT false,
  preferred_posting_times JSONB DEFAULT '{"morning": "09:00", "afternoon": "14:00", "evening": "19:00"}',
  content_guidelines TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.riven_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for Riven settings
CREATE POLICY "Users can manage their own Riven settings"
ON public.riven_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create workflow execution steps table for real-time tracking
CREATE TABLE public.workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow steps
CREATE POLICY "Admin can manage workflow steps"
ON public.workflow_steps 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Update social_media_accounts table with more fields
ALTER TABLE public.social_media_accounts 
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_secret TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS posting_permissions JSONB DEFAULT '{"post": true, "story": false, "reel": false}',
ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '{"hourly": 10, "daily": 100}',
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';

-- Create content approval workflow table
CREATE TABLE public.content_approval_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  assigned_to UUID,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_approval_workflow ENABLE ROW LEVEL SECURITY;

-- Create policies for content approval
CREATE POLICY "Admin can manage content approval"
ON public.content_approval_workflow 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create posting queue table
CREATE TABLE public.posting_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  platform TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  posted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  platform_post_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posting_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for posting queue
CREATE POLICY "Admin can manage posting queue"
ON public.posting_queue 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create campaign analytics table
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign analytics
CREATE POLICY "Admin can manage campaign analytics"
ON public.campaign_analytics 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Add updated_at trigger for new tables
CREATE TRIGGER update_riven_settings_updated_at
  BEFORE UPDATE ON public.riven_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_approval_workflow_updated_at
  BEFORE UPDATE ON public.content_approval_workflow
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posting_queue_updated_at
  BEFORE UPDATE ON public.posting_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();