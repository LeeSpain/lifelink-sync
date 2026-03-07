-- Soft-deactivate old tiers (do NOT delete)
UPDATE public.subscription_plans SET is_active = false WHERE name IN ('Family', 'Professional');

-- Update Individual plan features for new pricing model
UPDATE public.subscription_plans
SET
  description = 'Essential protection for one person. Includes SOS, Clara AI 24/7, live location sharing, 1 emergency contact, incident log, and 1 free Family Link.',
  features = ARRAY['SOS activation (app)', 'Clara AI 24/7', 'Live location sharing', '1 emergency contact', 'Incident log', '1 free Family Link'],
  trial_period_days = 7
WHERE name = 'Individual' AND is_active = true;
