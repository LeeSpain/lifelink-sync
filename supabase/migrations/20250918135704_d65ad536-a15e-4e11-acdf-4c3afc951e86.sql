-- Phase 1: Database Schema Fix

-- Fix email_campaigns table structure
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES marketing_content(id),
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS text_content text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_id uuid,
ADD COLUMN IF NOT EXISTS sender_email text DEFAULT 'noreply@example.com',
ADD COLUMN IF NOT EXISTS sender_name text DEFAULT 'Marketing Team',
ADD COLUMN IF NOT EXISTS tracking_enabled boolean DEFAULT true;

-- Create email_templates table for reusable templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject_template text NOT NULL,
  html_template text NOT NULL,
  text_template text,
  variables jsonb DEFAULT '{}',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create email_delivery_log table for tracking
CREATE TABLE IF NOT EXISTS email_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id uuid REFERENCES email_queue(id),
  campaign_id uuid REFERENCES email_campaigns(id),
  recipient_email text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'pending', -- pending, sent, delivered, bounced, failed
  provider_message_id text,
  provider_response jsonb DEFAULT '{}',
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  bounced_at timestamp with time zone,
  bounce_reason text,
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create email_automation_settings table
CREATE TABLE IF NOT EXISTS email_automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL, -- user_signup, profile_update, sos_activation, etc.
  template_id uuid REFERENCES email_templates(id),
  delay_minutes integer DEFAULT 0,
  is_enabled boolean DEFAULT true,
  target_criteria jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automation_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_templates
CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view active email templates" ON email_templates
  FOR SELECT USING (is_active = true);

-- Create RLS policies for email_delivery_log
CREATE POLICY "Admin can view email delivery logs" ON email_delivery_log
  FOR SELECT USING (is_admin());

CREATE POLICY "System can manage email delivery logs" ON email_delivery_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Create RLS policies for email_automation_settings
CREATE POLICY "Admin can manage email automation settings" ON email_automation_settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_content_id ON email_campaigns(content_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_status ON email_delivery_log(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_campaign ON email_delivery_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_delivery_log_updated_at
  BEFORE UPDATE ON email_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_automation_settings_updated_at
  BEFORE UPDATE ON email_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, description, subject_template, html_template, text_template, category) VALUES
('Welcome Email', 'Welcome new subscribers', 'Welcome to {{company_name}}!', 
 '<h1>Welcome {{name}}!</h1><p>Thank you for joining {{company_name}}. We''re excited to have you on board!</p>', 
 'Welcome {{name}}! Thank you for joining {{company_name}}. We''re excited to have you on board!', 'onboarding'),
('Newsletter', 'Weekly newsletter template', '{{subject}} - {{company_name}} Newsletter', 
 '<h1>{{title}}</h1><div>{{content}}</div><p>Best regards,<br>{{company_name}} Team</p>', 
 '{{title}}\n\n{{content}}\n\nBest regards,\n{{company_name}} Team', 'newsletter'),
('Marketing Campaign', 'General marketing campaign template', '{{subject}}', 
 '<h1>{{title}}</h1><div>{{content}}</div><p>{{call_to_action}}</p>', 
 '{{title}}\n\n{{content}}\n\n{{call_to_action}}', 'marketing');

-- Insert default automation settings
INSERT INTO email_automation_settings (trigger_type, template_id, delay_minutes, target_criteria) VALUES
('user_signup', (SELECT id FROM email_templates WHERE name = 'Welcome Email' LIMIT 1), 5, '{"new_users": true}'),
('profile_update', (SELECT id FROM email_templates WHERE name = 'Newsletter' LIMIT 1), 60, '{"profile_complete": true}');