-- Phase 1: Fix database schema issues (corrected)

-- Update registration_selections table to use text session_id instead of UUID
ALTER TABLE public.registration_selections 
ALTER COLUMN session_id TYPE text;

-- Insert default subscription plans with correct JSONB format for features
INSERT INTO public.subscription_plans (name, description, price, currency, features, is_popular, sort_order) VALUES
('Personal Account', 'Basic personal protection plan', 1.99, 'EUR', '["Emergency SOS", "Location tracking", "Emergency contacts"]'::jsonb, false, 1),
('Guardian Wellness', 'Comprehensive health and wellness monitoring', 4.99, 'EUR', '["Emergency SOS", "Health monitoring", "Medical alerts", "Family notifications"]'::jsonb, true, 2),
('Family Sharing', 'Family protection and communication', 0.99, 'EUR', '["Family group management", "Shared emergency contacts", "Group notifications"]'::jsonb, false, 3),
('Call Centre (Spain)', 'Professional call center services for Spain', 24.99, 'EUR', '["24/7 Spanish call center", "Local emergency response", "Professional monitoring"]'::jsonb, false, 4)
ON CONFLICT (name) DO NOTHING;