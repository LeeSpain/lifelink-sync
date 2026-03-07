-- Create gmail_tokens table for secure token storage
CREATE TABLE public.gmail_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/gmail.modify',
  email_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own gmail tokens" 
ON public.gmail_tokens 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage gmail tokens" 
ON public.gmail_tokens 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_gmail_tokens_updated_at
BEFORE UPDATE ON public.gmail_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create email_automation_settings table
CREATE TABLE public.email_automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_type TEXT NOT NULL, -- 'user_signup', 'profile_incomplete', 'interval', 'manual'
  trigger_config JSONB NOT NULL DEFAULT '{}',
  email_template TEXT NOT NULL,
  recipient_filter TEXT NOT NULL DEFAULT 'all', -- 'all', 'subscribers', 'new_users', etc.
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_automation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage email automation settings" 
ON public.email_automation_settings 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_email_automation_settings_updated_at
BEFORE UPDATE ON public.email_automation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create email_queue table for campaign queue management
CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.email_campaigns(id),
  automation_id UUID REFERENCES public.email_automation_settings(id),
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  priority INTEGER NOT NULL DEFAULT 5, -- 1 (highest) to 10 (lowest)
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage email queue" 
ON public.email_queue 
FOR ALL 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON public.email_queue(scheduled_at);
CREATE INDEX idx_email_queue_priority ON public.email_queue(priority);

-- Add trigger for updated_at
CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default automation settings
INSERT INTO public.email_automation_settings (
  name, 
  description, 
  trigger_type, 
  trigger_config, 
  email_template,
  is_enabled
) VALUES 
(
  'Welcome Email',
  'Send welcome email to new users immediately after signup',
  'user_signup',
  '{"delay_minutes": 0}',
  'welcome',
  true
),
(
  'Profile Completion Reminder',
  'Remind users to complete their profile after 24 hours',
  'profile_incomplete',
  '{"delay_hours": 24, "check_fields": ["emergency_contacts", "medical_conditions"]}',
  'follow_up',
  false
);