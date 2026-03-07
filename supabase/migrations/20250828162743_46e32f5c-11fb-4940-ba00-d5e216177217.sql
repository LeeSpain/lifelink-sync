-- Fix security linter: set search_path on newly added trigger functions

CREATE OR REPLACE FUNCTION public.check_contact_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM public.emergency_contacts 
    WHERE user_id = NEW.user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 emergency contacts allowed per user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_family_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.type = 'family' THEN
    -- Validation of matching active membership will be handled at application level for now
    NULL;
  END IF;
  RETURN NEW;
END;
$$;