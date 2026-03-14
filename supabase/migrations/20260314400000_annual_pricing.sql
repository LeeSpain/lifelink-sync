-- ============================================================
-- Commercial Build 1: Annual Pricing Foundation
-- Adds annual Individual Plan, pricing config, CLARA training
-- ============================================================

-- 1. Insert annual Individual Plan into subscription_plans
INSERT INTO public.subscription_plans (name, description, price, currency, billing_interval, features, is_active, is_popular, sort_order)
VALUES (
  'Individual Annual',
  'Essential protection — billed annually. Save 19.98 EUR (2 months free).',
  99.90,
  'EUR',
  'year',
  '["SOS activation (app)", "Clara AI 24/7", "Live location sharing", "1 emergency contact", "Incident log", "1 free Family Link", "Save 2 months free"]'::jsonb,
  true,
  false,
  1
);

-- 2. Add annual price to pricing_config
INSERT INTO pricing_config (key, value, label, description) VALUES
  ('individual_annual', 99.90, 'Individual Plan (Annual)', 'Annual billing — save 2 months free')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, label = EXCLUDED.label, description = EXCLUDED.description;

-- 3. Add CLARA training data for annual pricing
INSERT INTO public.training_data (question, answer, category, status, audience, tags, confidence_score) VALUES
('Is there an annual plan?',
 'Yes! Our Individual Plan is available annually for just 99.90 EUR per year — that saves you 19.98 EUR compared to paying monthly. It is like getting 2 months completely free. Same full protection, same features, just better value.',
 'pricing', 'active', 'customer', '{"annual","pricing","savings"}', 1.0),
('How much is the annual plan?',
 'The annual Individual Plan is 99.90 EUR per year. That works out to about 8.33 EUR per month — compared to 9.99 EUR per month on the monthly plan. You save 19.98 EUR, which is 2 full months free.',
 'pricing', 'active', 'customer', '{"annual","pricing","cost"}', 1.0),
('Do I save money with annual billing?',
 'Absolutely. The annual plan saves you 19.98 EUR per year — that is 2 months completely free. You pay 99.90 EUR once per year instead of 9.99 EUR every month. Same features, same protection, just better value for committing to a year.',
 'pricing', 'active', 'customer', '{"annual","savings","billing"}', 1.0),
('Can I switch from monthly to annual?',
 'Yes, you can switch to annual billing anytime from your dashboard. When you switch, your current monthly subscription ends at the next billing date and your annual plan starts from there. You will immediately start saving.',
 'pricing', 'active', 'customer', '{"annual","switch","billing"}', 1.0)
ON CONFLICT DO NOTHING;
