-- Enable realtime for regional emergency tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE regional_sos_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE family_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Set REPLICA IDENTITY FULL for real-time updates
ALTER TABLE regional_sos_events REPLICA IDENTITY FULL;
ALTER TABLE family_notifications REPLICA IDENTITY FULL;