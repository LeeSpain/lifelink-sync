-- Auto-log lead_activities when invite milestones happen
CREATE OR REPLACE FUNCTION log_lead_invite_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Invited via SMS
  IF NEW.sms_sent = true AND (OLD IS NULL OR OLD.sms_sent IS NULL OR OLD.sms_sent = false) THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, subject, content, metadata)
    VALUES (NEW.lead_id, 'invite_sent', 'Invite sent via SMS',
      'CLARA sent invite link via SMS',
      jsonb_build_object('channel', 'sms', 'token', NEW.token));
  END IF;
  -- Invited via Email
  IF NEW.email_sent = true AND (OLD IS NULL OR OLD.email_sent IS NULL OR OLD.email_sent = false) THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, subject, content, metadata)
    VALUES (NEW.lead_id, 'invite_sent', 'Invite sent via Email',
      'CLARA sent invite link via email',
      jsonb_build_object('channel', 'email', 'token', NEW.token));
  END IF;
  -- Invited via Messenger
  IF NEW.messenger_sent = true AND (OLD IS NULL OR OLD.messenger_sent IS NULL OR OLD.messenger_sent = false) THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, subject, content, metadata)
    VALUES (NEW.lead_id, 'invite_sent', 'Invite sent via Messenger',
      'CLARA sent invite link via Facebook Messenger',
      jsonb_build_object('channel', 'messenger', 'token', NEW.token));
  END IF;
  -- Clicked
  IF NEW.clicked = true AND (OLD IS NULL OR OLD.clicked IS NULL OR OLD.clicked = false) THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, subject, content, metadata)
    VALUES (NEW.lead_id, 'link_clicked', 'Invite link clicked',
      'Lead opened the personal invite page',
      jsonb_build_object('channel', NEW.clicked_channel, 'token', NEW.token));
  END IF;
  -- Trial
  IF NEW.trial_started = true AND (OLD IS NULL OR OLD.trial_started IS NULL OR OLD.trial_started = false) THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, subject, content, metadata)
    VALUES (NEW.lead_id, 'trial_started', 'Trial started!',
      'Lead signed up for 7-day free trial',
      jsonb_build_object('token', NEW.token));
  END IF;
  -- Subscribed
  IF NEW.subscribed = true AND (OLD IS NULL OR OLD.subscribed IS NULL OR OLD.subscribed = false) THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, subject, content, metadata)
    VALUES (NEW.lead_id, 'converted', 'Subscribed!',
      'Lead became a paying subscriber',
      jsonb_build_object('token', NEW.token));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

DROP TRIGGER IF EXISTS trigger_log_lead_invite_activity ON public.lead_invites;
CREATE TRIGGER trigger_log_lead_invite_activity
  AFTER INSERT OR UPDATE ON public.lead_invites
  FOR EACH ROW EXECUTE FUNCTION log_lead_invite_activity();
