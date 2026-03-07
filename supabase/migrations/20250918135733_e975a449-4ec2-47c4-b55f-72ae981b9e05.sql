-- Phase 1: Database Schema Fix (continued)

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

-- Enable RLS on new tables (if they don't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_templates' AND schemaname = 'public') THEN
    ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_delivery_log' AND schemaname = 'public') THEN
    ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_automation_settings' AND schemaname = 'public') THEN
    ALTER TABLE email_automation_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_content_id ON email_campaigns(content_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_status ON email_delivery_log(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_campaign ON email_delivery_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at);