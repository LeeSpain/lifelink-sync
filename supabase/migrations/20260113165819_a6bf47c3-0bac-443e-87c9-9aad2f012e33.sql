-- Create SLA settings table
CREATE TABLE public.sla_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT, -- 'email', 'whatsapp', 'web_chat', or NULL for all channels
  priority INTEGER CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5)), -- 1 (low) to 5 (urgent)
  first_response_target_minutes INTEGER NOT NULL DEFAULT 60,
  resolution_target_minutes INTEGER NOT NULL DEFAULT 480,
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_after_minutes INTEGER DEFAULT 30,
  escalate_to_user_id UUID,
  business_hours_only BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create business hours table
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create SLA breaches tracking table
CREATE TABLE public.sla_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES unified_conversations(id) ON DELETE CASCADE,
  sla_setting_id UUID REFERENCES sla_settings(id) ON DELETE SET NULL,
  breach_type TEXT NOT NULL CHECK (breach_type IN ('first_response', 'resolution')),
  target_minutes INTEGER NOT NULL,
  actual_minutes INTEGER,
  breached_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  escalated_to UUID,
  escalation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_sla_settings_channel ON public.sla_settings(channel) WHERE is_active = true;
CREATE INDEX idx_sla_settings_priority ON public.sla_settings(priority) WHERE is_active = true;
CREATE INDEX idx_sla_breaches_conversation ON public.sla_breaches(conversation_id);
CREATE INDEX idx_sla_breaches_unresolved ON public.sla_breaches(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_business_hours_day ON public.business_hours(day_of_week) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sla_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_breaches ENABLE ROW LEVEL SECURITY;

-- SLA Settings policies - Admin only
CREATE POLICY "Admins can view SLA settings" ON public.sla_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create SLA settings" ON public.sla_settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update SLA settings" ON public.sla_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete SLA settings" ON public.sla_settings
  FOR DELETE USING (public.is_admin());

-- Business Hours policies - Admin only
CREATE POLICY "Admins can view business hours" ON public.business_hours
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create business hours" ON public.business_hours
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update business hours" ON public.business_hours
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete business hours" ON public.business_hours
  FOR DELETE USING (public.is_admin());

-- SLA Breaches policies - Admin only
CREATE POLICY "Admins can view SLA breaches" ON public.sla_breaches
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create SLA breaches" ON public.sla_breaches
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update SLA breaches" ON public.sla_breaches
  FOR UPDATE USING (public.is_admin());

-- Create trigger for updated_at on sla_settings
CREATE TRIGGER update_sla_settings_updated_at
  BEFORE UPDATE ON public.sla_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default business hours (Monday-Friday 9am-5pm)
INSERT INTO public.business_hours (day_of_week, start_time, end_time, is_active) VALUES
  (1, '09:00', '17:00', true), -- Monday
  (2, '09:00', '17:00', true), -- Tuesday
  (3, '09:00', '17:00', true), -- Wednesday
  (4, '09:00', '17:00', true), -- Thursday
  (5, '09:00', '17:00', true), -- Friday
  (0, '09:00', '17:00', false), -- Sunday (closed)
  (6, '09:00', '17:00', false); -- Saturday (closed)

-- Insert default SLA settings
INSERT INTO public.sla_settings (name, description, channel, priority, first_response_target_minutes, resolution_target_minutes, escalation_enabled, escalation_after_minutes, business_hours_only) VALUES
  ('Standard Email SLA', 'Default SLA for email conversations', 'email', NULL, 60, 480, true, 45, true),
  ('WhatsApp SLA', 'Faster response for WhatsApp messages', 'whatsapp', NULL, 30, 240, true, 20, true),
  ('Urgent Priority SLA', 'Expedited handling for urgent issues', NULL, 5, 15, 120, true, 10, false);