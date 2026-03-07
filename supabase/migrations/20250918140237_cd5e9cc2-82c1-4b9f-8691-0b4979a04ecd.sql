-- Fix email_templates table structure and create simplified templates

-- Drop and recreate email_templates with correct structure
DROP TABLE IF EXISTS email_templates CASCADE;

CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  variables jsonb DEFAULT '{}',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view active email templates" ON email_templates
  FOR SELECT USING (is_active = true);

-- Add trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert basic templates
INSERT INTO email_templates (name, description, subject_template, body_template, category) VALUES
('Welcome Email', 'Welcome new subscribers', 'Welcome to {{company_name}}!', 
 '<h1>Welcome {{name}}!</h1><p>Thank you for joining {{company_name}}. We''re excited to have you on board!</p>', 'onboarding'),
('Marketing Campaign', 'General marketing campaign template', '{{subject}}', 
 '<h1>{{title}}</h1><div>{{content}}</div><p>{{call_to_action}}</p>', 'marketing'),
('Newsletter', 'Newsletter template', '{{subject}} - Newsletter', 
 '<h1>{{title}}</h1><div>{{content}}</div><p>Best regards,<br>The Team</p>', 'newsletter');