-- Remove duplicate location entries, keep only the latest per user per family group
WITH latest_locations AS (
  SELECT DISTINCT ON (user_id, family_group_id) 
    id, user_id, family_group_id, last_seen
  FROM live_locations 
  ORDER BY user_id, family_group_id, last_seen DESC
)
DELETE FROM live_locations 
WHERE id NOT IN (SELECT id FROM latest_locations);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_locations_user_group 
ON live_locations (user_id, family_group_id);

-- Update the live location trigger to use UPSERT instead of INSERT
CREATE OR REPLACE FUNCTION public.upsert_live_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use INSERT ... ON CONFLICT to prevent duplicates
  INSERT INTO live_locations (
    user_id, family_group_id, latitude, longitude, 
    accuracy, speed, heading, battery_level, status, last_seen, updated_at
  ) 
  VALUES (
    NEW.user_id, NEW.family_group_id, NEW.latitude, NEW.longitude,
    NEW.accuracy, NEW.speed, NEW.heading, NEW.battery_level, NEW.status, now(), now()
  )
  ON CONFLICT (user_id, family_group_id)
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    speed = EXCLUDED.speed,
    heading = EXCLUDED.heading,
    battery_level = EXCLUDED.battery_level,
    status = EXCLUDED.status,
    last_seen = now(),
    updated_at = now();
    
  RETURN NEW;
END;
$function$;