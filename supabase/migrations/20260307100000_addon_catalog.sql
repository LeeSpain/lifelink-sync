-- Add-on catalog table for modular subscription add-ons
CREATE TABLE IF NOT EXISTS public.addon_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 2.99,
  currency TEXT NOT NULL DEFAULT 'EUR',
  interval_type TEXT NOT NULL DEFAULT 'month',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  category TEXT DEFAULT 'wellness',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active addons"
  ON public.addon_catalog FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage addons"
  ON public.addon_catalog FOR ALL USING (is_admin());

-- Seed the three add-ons
INSERT INTO public.addon_catalog (slug, name, description, price, currency, category, sort_order, icon, features) VALUES
  ('family_link', 'Family Link', 'Add a family member to your protection circle. First link free with Individual Plan.', 2.99, 'EUR', 'family', 1, 'Users', '["Live SOS alerts","Shared map","Received & On It acknowledgment"]'::jsonb),
  ('daily_wellbeing', 'Daily Wellbeing', 'Daily wellness check-ins and health tracking powered by CLARA AI.', 2.99, 'EUR', 'wellness', 2, 'Heart', '["Daily check-in prompts","Mood tracking","Wellness reports"]'::jsonb),
  ('medication_reminder', 'Medication Reminder', 'Smart medication reminders with confirmation tracking.', 2.99, 'EUR', 'wellness', 3, 'Pill', '["Custom schedules","Missed dose alerts","Compliance reports"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

CREATE TRIGGER update_addon_catalog_updated_at
  BEFORE UPDATE ON public.addon_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
