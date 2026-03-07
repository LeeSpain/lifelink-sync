-- Phase 3: Complete remaining workflow integration fixes

-- Ensure email_campaigns has all required columns and constraints
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS sender_email text DEFAULT 'marketing@icesoslite.com',
ADD COLUMN IF NOT EXISTS sender_name text DEFAULT 'ICE SOS Lite Team',
ADD COLUMN IF NOT EXISTS tracking_enabled boolean DEFAULT true;

-- Fix any RLS issues on email tables that might be missing
ALTER TABLE email_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automation_settings ENABLE ROW LEVEL SECURITY;

-- Create missing RLS policies if they don't exist
DO $$ 
BEGIN
  -- Ensure email_delivery_log policies exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_delivery_log' AND policyname = 'Service can manage delivery logs') THEN
    CREATE POLICY "Service can manage delivery logs" ON email_delivery_log
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  
  -- Ensure email_automation_settings policies exist  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_automation_settings' AND policyname = 'Admin can manage automation settings') THEN
    CREATE POLICY "Admin can manage automation settings" ON email_automation_settings
      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- Create a function to safely create email campaigns from content
CREATE OR REPLACE FUNCTION public.create_email_campaign_from_content(
  p_content_id uuid,
  p_campaign_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
  v_content record;
  v_subject text;
  v_html_body text;
BEGIN
  -- Get the content
  SELECT * INTO v_content
  FROM marketing_content 
  WHERE id = p_content_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content not found: %', p_content_id;
  END IF;
  
  -- Generate subject and body
  v_subject := COALESCE(v_content.seo_title, v_content.title, 'Newsletter Update');
  v_html_body := COALESCE(v_content.body_text, 'Content coming soon...');
  
  -- Create campaign
  INSERT INTO email_campaigns (
    content_id,
    name,
    subject,
    content,
    text_content,
    status,
    sender_email,
    sender_name,
    tracking_enabled,
    metadata
  ) VALUES (
    p_content_id,
    COALESCE(p_campaign_name, v_content.title, 'Email Campaign'),
    v_subject,
    v_html_body,
    regexp_replace(v_html_body, '<[^>]*>', '', 'g'), -- Strip HTML for text version
    'draft',
    'marketing@icesoslite.com',
    'ICE SOS Lite Team',
    true,
    jsonb_build_object(
      'content_type', v_content.content_type,
      'platform', v_content.platform,
      'auto_generated', true,
      'created_at', now()
    )
  ) RETURNING id INTO v_campaign_id;
  
  RETURN v_campaign_id;
END;
$$;