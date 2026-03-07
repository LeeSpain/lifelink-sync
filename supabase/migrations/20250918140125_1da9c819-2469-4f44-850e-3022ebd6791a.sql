-- Fix security issues: Enable RLS on missing tables

-- Enable RLS on email_templates table
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_delivery_log table  
ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_automation_settings table
ALTER TABLE email_automation_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_templates
DROP POLICY IF EXISTS "Admin can manage email templates" ON email_templates;
CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can view active email templates" ON email_templates;  
CREATE POLICY "Public can view active email templates" ON email_templates
  FOR SELECT USING (is_active = true);

-- Create RLS policies for email_delivery_log
DROP POLICY IF EXISTS "Admin can view email delivery logs" ON email_delivery_log;
CREATE POLICY "Admin can view email delivery logs" ON email_delivery_log
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "System can manage email delivery logs" ON email_delivery_log;
CREATE POLICY "System can manage email delivery logs" ON email_delivery_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Create RLS policies for email_automation_settings
DROP POLICY IF EXISTS "Admin can manage email automation settings" ON email_automation_settings;
CREATE POLICY "Admin can manage email automation settings" ON email_automation_settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_delivery_log_updated_at ON email_delivery_log;
CREATE TRIGGER update_email_delivery_log_updated_at
  BEFORE UPDATE ON email_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_automation_settings_updated_at ON email_automation_settings;
CREATE TRIGGER update_email_automation_settings_updated_at
  BEFORE UPDATE ON email_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates if they don't exist
INSERT INTO email_templates (name, description, subject_template, html_template, text_template, category) 
SELECT 'Welcome Email', 'Welcome new subscribers', 'Welcome to {{company_name}}!', 
 '<h1>Welcome {{name}}!</h1><p>Thank you for joining {{company_name}}. We''re excited to have you on board!</p>', 
 'Welcome {{name}}! Thank you for joining {{company_name}}. We''re excited to have you on board!', 'onboarding'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Welcome Email');

INSERT INTO email_templates (name, description, subject_template, html_template, text_template, category) 
SELECT 'Newsletter', 'Weekly newsletter template', '{{subject}} - {{company_name}} Newsletter', 
 '<h1>{{title}}</h1><div>{{content}}</div><p>Best regards,<br>{{company_name}} Team</p>', 
 '{{title}}\n\n{{content}}\n\nBest regards,\n{{company_name}} Team', 'newsletter'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Newsletter');

INSERT INTO email_templates (name, description, subject_template, html_template, text_template, category) 
SELECT 'Marketing Campaign', 'General marketing campaign template', '{{subject}}', 
 '<h1>{{title}}</h1><div>{{content}}</div><p>{{call_to_action}}</p>', 
 '{{title}}\n\n{{content}}\n\n{{call_to_action}}', 'marketing'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Marketing Campaign');