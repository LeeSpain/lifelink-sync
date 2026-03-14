-- Update check_contact_limit() to enforce plan-based limits:
-- free plan (subscription_tier IS NULL or 'free') = max 1 contact
-- paid plan = max 5 contacts
-- Queries subscribers table for subscription_tier

DROP TRIGGER IF EXISTS enforce_contact_limit ON emergency_contacts;
DROP FUNCTION IF EXISTS check_contact_limit();

CREATE OR REPLACE FUNCTION check_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  contact_count INT;
  max_contacts INT;
  user_tier TEXT;
BEGIN
  -- Get subscription tier from subscribers table
  SELECT s.subscription_tier
  INTO user_tier
  FROM subscribers s
  WHERE s.user_id = NEW.user_id
  LIMIT 1;

  -- Determine limit based on tier
  -- NULL or 'free' = 1 contact, any paid tier = 5 contacts
  IF user_tier IS NOT NULL AND user_tier != 'free' THEN
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

CREATE TRIGGER enforce_contact_limit
  BEFORE INSERT ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_limit();
