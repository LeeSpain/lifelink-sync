-- Create email templates with variable replacement support
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'workflow', -- 'workflow', 'auto_reply', 'campaign'
  variables JSONB NOT NULL DEFAULT '[]'::jsonb, -- Available variables for replacement
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation categories for smart routing
CREATE TABLE public.conversation_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] DEFAULT ARRAY[]::text[],
  ai_confidence_threshold NUMERIC DEFAULT 0.7,
  auto_assign_to_user UUID,
  priority_level INTEGER DEFAULT 3, -- 1=highest, 5=lowest
  response_template_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auto-reply queue with admin approval
CREATE TABLE public.auto_reply_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  original_message_id UUID,
  generated_reply TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  category_id UUID,
  template_used UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'sent'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  scheduled_send_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow triggers for email automation
CREATE TABLE public.workflow_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'user_signup', 'conversation_category', 'time_based', 'user_action'
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_template_id UUID NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow executions log
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_trigger_id UUID NOT NULL,
  user_id UUID,
  conversation_id UUID,
  email_template_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  variables_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation routing rules
CREATE TABLE public.routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Conditions for routing
  action_type TEXT NOT NULL, -- 'assign_user', 'assign_category', 'trigger_workflow', 'auto_reply'
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin management
CREATE POLICY "Admin can manage email templates" ON public.email_templates FOR ALL USING (true);
CREATE POLICY "Admin can manage conversation categories" ON public.conversation_categories FOR ALL USING (true);
CREATE POLICY "Admin can manage auto reply queue" ON public.auto_reply_queue FOR ALL USING (true);
CREATE POLICY "Admin can manage workflow triggers" ON public.workflow_triggers FOR ALL USING (true);
CREATE POLICY "Admin can view workflow executions" ON public.workflow_executions FOR SELECT USING (true);
CREATE POLICY "System can manage workflow executions" ON public.workflow_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update workflow executions" ON public.workflow_executions FOR UPDATE USING (true);
CREATE POLICY "Admin can manage routing rules" ON public.routing_rules FOR ALL USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_categories_updated_at
  BEFORE UPDATE ON public.conversation_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_reply_queue_updated_at
  BEFORE UPDATE ON public.auto_reply_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_triggers_updated_at
  BEFORE UPDATE ON public.workflow_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON public.routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (name, description, subject_template, body_template, template_type, variables) VALUES
('Welcome New User', 'Welcome email for new signups', 
 'Welcome to {{company_name}}, {{first_name}}!', 
 '<h1>Welcome {{first_name}}!</h1><p>Thank you for joining {{company_name}}. We''re excited to have you on board.</p><p>Your emergency protection is now active.</p><p>Best regards,<br>The {{company_name}} Team</p>',
 'workflow',
 '["first_name", "last_name", "email", "company_name"]'::jsonb),

('Follow-up Check', 'Follow-up email after 24 hours',
 'How are you finding {{company_name}}?',
 '<h1>Hi {{first_name}},</h1><p>It''s been 24 hours since you joined {{company_name}}. How are you finding our emergency protection service?</p><p>If you have any questions, just reply to this email.</p><p>Stay safe,<br>The {{company_name}} Team</p>',
 'workflow',
 '["first_name", "company_name"]'::jsonb),

('Auto Reply - General Inquiry', 'Automatic response for general questions',
 'Thank you for contacting us',
 '<p>Hi {{contact_name}},</p><p>Thank you for your message. We''ve received your inquiry and our team will get back to you within 24 hours.</p><p>For urgent matters, please use our emergency contact system.</p><p>Best regards,<br>Support Team</p>',
 'auto_reply',
 '["contact_name", "inquiry_type"]'::jsonb);

-- Insert default conversation categories
INSERT INTO public.conversation_categories (name, description, keywords, priority_level) VALUES
('Emergency', 'Emergency-related conversations', ARRAY['emergency', 'urgent', 'help', 'sos', 'crisis'], 1),
('Support', 'General support inquiries', ARRAY['help', 'support', 'question', 'issue', 'problem'], 2),
('Billing', 'Billing and payment related', ARRAY['billing', 'payment', 'invoice', 'charge', 'subscription'], 3),
('Technical', 'Technical issues and bugs', ARRAY['bug', 'error', 'technical', 'app', 'login'], 2),
('Sales', 'Sales and product inquiries', ARRAY['pricing', 'plan', 'purchase', 'buy', 'upgrade'], 3);

-- Insert default workflow triggers
INSERT INTO public.workflow_triggers (name, description, trigger_type, trigger_conditions, email_template_id, delay_minutes) VALUES
('Welcome New User', 'Send welcome email immediately after signup', 'user_signup', '{"event": "user_created"}'::jsonb, 
 (SELECT id FROM email_templates WHERE name = 'Welcome New User'), 0),
('24 Hour Follow-up', 'Follow-up email 24 hours after signup', 'user_signup', '{"event": "user_created"}'::jsonb,
 (SELECT id FROM email_templates WHERE name = 'Follow-up Check'), 1440);

-- Insert default routing rules
INSERT INTO public.routing_rules (name, description, conditions, action_type, action_config, priority) VALUES
('Emergency Priority', 'Route emergency conversations to high priority', 
 '{"keywords": ["emergency", "urgent", "sos"], "confidence_min": 0.8}'::jsonb,
 'assign_category',
 '{"category_name": "Emergency", "priority": 1}'::jsonb, 1),
('Auto Reply General', 'Send auto-reply for general inquiries',
 '{"keywords": ["question", "help", "info"], "confidence_min": 0.6}'::jsonb,
 'auto_reply',
 '{"template_name": "Auto Reply - General Inquiry", "require_approval": true}'::jsonb, 3);