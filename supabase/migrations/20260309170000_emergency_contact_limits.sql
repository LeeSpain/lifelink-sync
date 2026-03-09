-- Emergency contact limits: trial = 1, paid = 5
-- Enforced at database level via trigger

-- Add contact limit config to pricing_config
INSERT INTO pricing_config (key, value, label, description)
VALUES
  ('trial_max_contacts', 1, 'Trial Max Emergency Contacts', 'Maximum contacts during free trial'),
  ('paid_max_contacts', 5, 'Paid Max Emergency Contacts', 'Maximum contacts on paid plan')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Trigger function to enforce contact limit
CREATE OR REPLACE FUNCTION check_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  contact_count INT;
  max_contacts INT;
  is_subscribed BOOLEAN;
  is_trial BOOLEAN;
BEGIN
  -- Check subscribers table for subscription status
  SELECT s.subscribed, COALESCE(s.is_trialing, false)
  INTO is_subscribed, is_trial
  FROM subscribers s
  WHERE s.user_id = NEW.user_id
  LIMIT 1;

  -- Determine limit: paid users get 5, trial/free get 1
  IF is_subscribed = true AND is_trial = false THEN
    max_contacts := 5;
  ELSE
    max_contacts := 1;
  END IF;

  -- Count existing contacts for this user
  SELECT COUNT(*) INTO contact_count
  FROM emergency_contacts
  WHERE user_id = NEW.user_id;

  -- Enforce limit
  IF contact_count >= max_contacts THEN
    RAISE EXCEPTION 'Contact limit reached. Your plan allows % emergency contact(s). Upgrade to add more.', max_contacts;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_contact_limit ON emergency_contacts;
CREATE TRIGGER enforce_contact_limit
  BEFORE INSERT ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_limit();
