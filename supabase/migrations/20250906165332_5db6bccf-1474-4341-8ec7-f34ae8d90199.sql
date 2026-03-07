-- Create marketing_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  command TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium',
  budget_estimate NUMERIC,
  target_audience TEXT,
  platforms TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for marketing_campaigns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
      AND tablename='marketing_campaigns' 
      AND policyname='Admin can manage marketing campaigns'
  ) THEN
    CREATE POLICY "Admin can manage marketing campaigns"
    ON public.marketing_campaigns
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END$$;

-- Create updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_marketing_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER update_marketing_campaigns_updated_at
      BEFORE UPDATE ON public.marketing_campaigns
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Add missing columns to workflow_stages if they don't exist
ALTER TABLE public.workflow_stages 
ADD COLUMN IF NOT EXISTS stage_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_stages_campaign_id 
ON public.workflow_stages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_marketing_content_campaign_id 
ON public.marketing_content(campaign_id);