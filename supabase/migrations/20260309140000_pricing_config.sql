-- Pricing configuration table
-- Admin edits here, frontend reads from here
-- Single source of truth for all displayed prices

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with correct prices
INSERT INTO pricing_config (key, value, label, description) VALUES
  ('individual_monthly', 9.99,
   'Individual Plan',
   'Monthly subscription for one member'),
  ('family_link_monthly', 2.99,
   'Extra Family Link',
   'Additional family member link per month'),
  ('addon_daily_wellbeing', 2.99,
   'Daily Wellbeing Add-On',
   'Daily check-in calls and family digest'),
  ('addon_medication_reminder', 2.99,
   'Medication Reminder Add-On',
   'CLARA medication reminders and logging'),
  ('trial_days', 7,
   'Free Trial Period',
   'Days of free trial, no card required'),
  ('pendant_price', 59.99,
   'SOS Pendant',
   'Bluetooth SOS pendant one-time purchase')
ON CONFLICT (key) DO NOTHING;

-- RLS policies
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Anyone can READ prices (public)
CREATE POLICY "Public can read active pricing"
  ON pricing_config FOR SELECT
  USING (is_active = true);

-- Only admins can UPDATE prices
CREATE POLICY "Admins can update pricing"
  ON pricing_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Auto-update updated_at (reuse existing function if available)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_pricing_updated_at'
  ) THEN
    CREATE FUNCTION update_pricing_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END
$$;

CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_pricing_updated_at();
