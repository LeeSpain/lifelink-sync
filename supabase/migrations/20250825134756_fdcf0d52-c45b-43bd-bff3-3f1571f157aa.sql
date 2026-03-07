-- Phase 1: Fix database schema issues (final)

-- Update registration_selections table to use text session_id instead of UUID
ALTER TABLE public.registration_selections 
ALTER COLUMN session_id TYPE text;

-- Insert default subscription plans (removing conflict clause)
INSERT INTO public.subscription_plans (name, description, price, currency, features, is_popular, sort_order) 
SELECT 'Personal Account', 'Basic personal protection plan', 1.99, 'EUR', '["Emergency SOS", "Location tracking", "Emergency contacts"]'::jsonb, false, 1
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Personal Account');

INSERT INTO public.subscription_plans (name, description, price, currency, features, is_popular, sort_order) 
SELECT 'Guardian Wellness', 'Comprehensive health and wellness monitoring', 4.99, 'EUR', '["Emergency SOS", "Health monitoring", "Medical alerts", "Family notifications"]'::jsonb, true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Guardian Wellness');

INSERT INTO public.subscription_plans (name, description, price, currency, features, is_popular, sort_order) 
SELECT 'Family Sharing', 'Family protection and communication', 0.99, 'EUR', '["Family group management", "Shared emergency contacts", "Group notifications"]'::jsonb, false, 3
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Family Sharing');

INSERT INTO public.subscription_plans (name, description, price, currency, features, is_popular, sort_order) 
SELECT 'Call Centre (Spain)', 'Professional call center services for Spain', 24.99, 'EUR', '["24/7 Spanish call center", "Local emergency response", "Professional monitoring"]'::jsonb, false, 4
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Call Centre (Spain)');