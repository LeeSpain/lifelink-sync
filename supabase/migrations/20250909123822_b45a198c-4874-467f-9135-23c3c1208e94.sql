-- Simple cleanup without locks - just add the unique index for future prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_locations_user_group 
ON live_locations (user_id, family_group_id);