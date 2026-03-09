-- Phase 1: Fix database schema issues

-- Update registration_selections table to use text session_id instead of UUID
ALTER TABLE public.registration_selections 
ALTER COLUMN session_id TYPE text;

-- Add missing subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  interval_type TEXT NOT NULL DEFAULT 'month',
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for public to view active subscription plans
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Create policy for admin to manage subscription plans
DROP POLICY IF EXISTS "Admin can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admin can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (is_admin());

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, currency, features, is_popular, sort_order) VALUES
('Personal Account', 'Basic personal protection plan', 1.99, 'EUR', '["Emergency SOS", "Location tracking", "Emergency contacts"]'::jsonb, false, 1),
('Guardian Wellness', 'Comprehensive health and wellness monitoring', 4.99, 'EUR', '["Emergency SOS", "Health monitoring", "Medical alerts", "Family notifications"]'::jsonb, true, 2),
('Family Sharing', 'Family protection and communication', 0.99, 'EUR', '["Family group management", "Shared emergency contacts", "Group notifications"]'::jsonb, false, 3),
('Call Centre (Spain)', 'Professional call center services for Spain', 24.99, 'EUR', '["24/7 Spanish call center", "Local emergency response", "Professional monitoring"]'::jsonb, false, 4)
ON CONFLICT DO NOTHING;

-- Add subscribers table if missing
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email());

DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscribers_updated_at ON public.subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();