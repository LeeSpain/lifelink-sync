-- Add missing tables for family alerts and acknowledgments system

-- Create family_alerts table for storing alert history
CREATE TABLE public.family_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  family_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'sos_emergency',
  alert_data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on family_alerts
ALTER TABLE public.family_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_alerts
CREATE POLICY "Users can view their own family alerts" ON family_alerts
FOR SELECT USING (auth.uid() = family_user_id);

CREATE POLICY "SOS originators can view alerts for their events" ON family_alerts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sos_events se 
    WHERE se.id = family_alerts.event_id 
    AND se.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage family alerts" ON family_alerts
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage all family alerts" ON family_alerts
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add indexes for better performance
CREATE INDEX idx_family_alerts_event_id ON family_alerts(event_id);
CREATE INDEX idx_family_alerts_family_user_id ON family_alerts(family_user_id);
CREATE INDEX idx_family_alerts_sent_at ON family_alerts(sent_at);

CREATE INDEX idx_sos_events_status ON sos_events(status);
CREATE INDEX idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX idx_sos_events_group_id ON sos_events(group_id);

CREATE INDEX idx_sos_locations_event_id ON sos_locations(event_id);
CREATE INDEX idx_sos_locations_created_at ON sos_locations(created_at);

CREATE INDEX idx_sos_acknowledgements_event_id ON sos_acknowledgements(event_id);
CREATE INDEX idx_sos_acknowledgements_family_user_id ON sos_acknowledgements(family_user_id);

-- Add trigger for updated_at on family_alerts
CREATE TRIGGER update_family_alerts_updated_at
  BEFORE UPDATE ON family_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();