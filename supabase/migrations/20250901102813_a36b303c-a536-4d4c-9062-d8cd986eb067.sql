-- Enable Supabase Realtime for Live Map tables
-- This allows real-time subscriptions to location and place event updates

-- Enable realtime for live_presence table
ALTER PUBLICATION supabase_realtime ADD TABLE live_presence;

-- Enable realtime for place_events table  
ALTER PUBLICATION supabase_realtime ADD TABLE place_events;

-- Enable realtime for location_pings table (optional, for detailed tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE location_pings;

-- Ensure tables have replica identity for realtime updates
ALTER TABLE live_presence REPLICA IDENTITY FULL;
ALTER TABLE place_events REPLICA IDENTITY FULL;
ALTER TABLE location_pings REPLICA IDENTITY FULL;