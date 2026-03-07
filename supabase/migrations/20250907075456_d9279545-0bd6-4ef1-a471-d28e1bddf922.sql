-- Create a 1 Euro test subscription plan (fixed with JSONB array format)
INSERT INTO public.subscription_plans (
  id,
  name, 
  description,
  price,
  currency,
  billing_interval,
  features,
  is_active,
  is_popular,
  sort_order,
  region
) VALUES (
  gen_random_uuid(),
  'Test Plan - 1 Euro',
  'Special test plan for development and testing purposes - minimal cost payment testing',
  1.00,
  'EUR', 
  'month',
  '["Test emergency features", "Basic support", "Development testing only"]'::jsonb,
  true,
  false,
  0,
  'global'
);