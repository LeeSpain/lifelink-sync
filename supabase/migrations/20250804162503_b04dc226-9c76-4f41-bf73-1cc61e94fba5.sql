-- Add regional subscription plans to match homepage content
INSERT INTO public.subscription_plans (
  name,
  description,
  price,
  currency,
  billing_interval,
  features,
  is_active,
  is_popular,
  sort_order
) VALUES
-- Regional Call Centre plan for Spain
(
  'Call Centre',
  'Professional emergency response',
  24.99,
  'EUR',
  'month',
  ARRAY[
    '24/7 access to ICE Alarm support team',
    'Staff speak English and Spanish',
    'Direct escalation to call center',
    'Professional emergency response',
    'Geofenced to Spain region'
  ],
  true,
  false,
  10
);

-- Create homepage analytics table for tracking user interactions
CREATE TABLE public.homepage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_context TEXT DEFAULT 'homepage',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on homepage analytics
ALTER TABLE public.homepage_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for homepage analytics
CREATE POLICY "System can manage homepage analytics" 
ON public.homepage_analytics 
FOR ALL 
USING (true);

-- Add triggers for updated_at on subscription_plans if not exists
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add region column to subscription plans for regional filtering
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'global';

-- Update the Call Centre plan to be Spain-specific
UPDATE public.subscription_plans 
SET region = 'spain' 
WHERE name = 'Call Centre';