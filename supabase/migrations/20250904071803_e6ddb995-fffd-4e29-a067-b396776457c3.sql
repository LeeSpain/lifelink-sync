-- Enable realtime for regional emergency tables
ALTER PUBLICATION supabase_realtime ADD TABLE regional_sos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE family_notifications;

-- Set REPLICA IDENTITY FULL for real-time updates
ALTER TABLE regional_sos_events REPLICA IDENTITY FULL;
ALTER TABLE family_notifications REPLICA IDENTITY FULL;