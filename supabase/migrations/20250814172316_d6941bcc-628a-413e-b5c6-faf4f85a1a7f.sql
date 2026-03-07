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