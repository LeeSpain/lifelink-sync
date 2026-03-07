-- Create table for daily campaign metrics aggregation
CREATE TABLE public.riven_campaign_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_failed INTEGER NOT NULL DEFAULT 0,
  replies_received INTEGER NOT NULL DEFAULT 0,
  reply_rate NUMERIC NOT NULL DEFAULT 0,
  social_posts_posted INTEGER NOT NULL DEFAULT 0,
  social_posts_failed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(metric_date, campaign_id)
);

-- Create table for lead engagement tracking
CREATE TABLE public.riven_lead_engagement (
  lead_id UUID PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  last_touch_at TIMESTAMPTZ NULL,
  last_reply_at TIMESTAMPTZ NULL,
  total_replies INTEGER NOT NULL DEFAULT 0,
  last_campaign_id TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_riven_metrics_date ON public.riven_campaign_metrics_daily(metric_date);
CREATE INDEX idx_riven_metrics_campaign ON public.riven_campaign_metrics_daily(campaign_id);
CREATE INDEX idx_riven_engagement_touch ON public.riven_lead_engagement(last_touch_at);
CREATE INDEX idx_riven_engagement_reply ON public.riven_lead_engagement(last_reply_at);

-- Enable RLS
ALTER TABLE public.riven_campaign_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riven_lead_engagement ENABLE ROW LEVEL SECURITY;

-- RLS policies for riven_campaign_metrics_daily - authenticated read access
CREATE POLICY "Authenticated users can read campaign metrics" 
  ON public.riven_campaign_metrics_daily
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admin can insert/update metrics
CREATE POLICY "Admins can manage campaign metrics" 
  ON public.riven_campaign_metrics_daily
  FOR ALL 
  USING (public.is_admin());

-- RLS policies for riven_lead_engagement - access only if lead belongs to user
CREATE POLICY "Users can read their own lead engagement" 
  ON public.riven_lead_engagement
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Users can manage their own lead engagement" 
  ON public.riven_lead_engagement
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.user_id = auth.uid())
    OR public.is_admin()
  );

-- Trigger for updated_at on riven_lead_engagement
CREATE TRIGGER update_riven_lead_engagement_updated_at
  BEFORE UPDATE ON public.riven_lead_engagement
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();