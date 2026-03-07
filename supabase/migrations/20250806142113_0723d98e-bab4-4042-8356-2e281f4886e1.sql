-- Fix security warnings from linter

-- Fix functions with mutable search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT COALESCE(public.get_user_role() = 'admin', false);
$$;