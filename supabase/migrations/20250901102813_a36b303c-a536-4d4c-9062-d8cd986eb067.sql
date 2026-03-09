-- Enable Supabase Realtime for Live Map tables
-- This allows real-time subscriptions to location and place event updates

DO $$
BEGIN
  -- Enable realtime for live_presence table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_presence;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Enable realtime for place_events table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE place_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Enable realtime for location_pings table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE location_pings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Ensure tables have replica identity for realtime updates
ALTER TABLE live_presence REPLICA IDENTITY FULL;
ALTER TABLE place_events REPLICA IDENTITY FULL;
ALTER TABLE location_pings REPLICA IDENTITY FULL;
