-- Final cleanup of live_locations duplicates and ensure proper unique constraint

-- Delete duplicates keeping only the most recent per user/group
WITH duplicate_rows AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, family_group_id 
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM live_locations
)
DELETE FROM live_locations 
WHERE id IN (
  SELECT id FROM duplicate_rows WHERE rn > 1
);

-- Ensure the unique constraint exists (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_locations_user_group_unique 
ON live_locations (user_id, family_group_id);

-- Update the upsert function to properly handle the unique constraint
CREATE OR REPLACE FUNCTION upsert_live_location(
  p_user_id uuid,
  p_family_group_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision DEFAULT NULL,
  p_speed double precision DEFAULT NULL,
  p_heading double precision DEFAULT NULL,
  p_battery_level integer DEFAULT NULL,
  p_status text DEFAULT 'online'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO live_locations (
    user_id, family_group_id, latitude, longitude, 
    accuracy, speed, heading, battery_level, status,
    created_at, updated_at
  ) VALUES (
    p_user_id, p_family_group_id, p_latitude, p_longitude,
    p_accuracy, p_speed, p_heading, p_battery_level, p_status,
    now(), now()
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
    updated_at = now();
END;
$$;