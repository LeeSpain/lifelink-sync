-- Fix remaining function security warnings by setting search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(public.get_user_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.get_communication_metrics_summary()
RETURNS TABLE(date date, channel text, total_conversations bigint, total_messages bigint, avg_response_time numeric, avg_resolution_time numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  -- Check if user is admin, if not return empty result
  SELECT d.date, d.channel, d.total_conversations, d.total_messages, d.avg_response_time, d.avg_resolution_time
  FROM (
    SELECT date(uc.created_at) AS date,
           'email'::text AS channel,
           count(DISTINCT uc.id) AS total_conversations,
           count(*) AS total_messages,
           avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_response_time,
           avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_resolution_time
    FROM unified_conversations uc
    WHERE uc.channel = 'email'::text
    GROUP BY date(uc.created_at)
    
    UNION ALL
    
    SELECT date(uc.created_at) AS date,
           'whatsapp'::text AS channel,
           count(DISTINCT uc.id) AS total_conversations,
           count(*) AS total_messages,
           avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_response_time,
           avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_resolution_time
    FROM unified_conversations uc
    WHERE uc.channel = 'whatsapp'::text
    GROUP BY date(uc.created_at)
  ) d
  WHERE is_admin() = true;
$$;

CREATE OR REPLACE FUNCTION public.check_admin_setup_allowed()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count integer;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  -- Only allow setup if no admin exists
  RETURN admin_count = 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_communication_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.communication_preferences (user_id, email_notifications, marketing_emails)
  VALUES (NEW.id, true, true);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_gmail_token_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF OLD.access_token IS DISTINCT FROM NEW.access_token THEN
        NEW.last_refreshed_at = now();
        NEW.refresh_count = COALESCE(OLD.refresh_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$;