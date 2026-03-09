-- Enable Supabase Realtime for Live Map tables
-- This allows real-time subscriptions to location and place event updates

-- Enable realtime for live_presence, place_events, and location_pings tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_presence;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE place_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE location_pings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Ensure tables have replica identity for realtime updates
ALTER TABLE live_presence REPLICA IDENTITY FULL;
ALTER TABLE place_events REPLICA IDENTITY FULL;
ALTER TABLE location_pings REPLICA IDENTITY FULL;