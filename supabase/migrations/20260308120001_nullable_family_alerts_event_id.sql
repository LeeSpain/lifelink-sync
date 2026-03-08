-- Make event_id nullable on family_alerts so reminders/messages
-- don't require a dummy sos_events row
ALTER TABLE family_alerts ALTER COLUMN event_id DROP NOT NULL;
