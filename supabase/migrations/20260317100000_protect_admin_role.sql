-- ============================================================
-- Protect admin role from being overwritten
--
-- 1. Trigger prevents any UPDATE from changing role away from
--    'admin' for the owner account (leewakeman@hotmail.co.uk)
-- 2. Fix handle_new_user to never overwrite role on conflict
-- 3. Ensure admin role is set correctly now
-- ============================================================

-- ── 1. Protection trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If trying to change role away from admin
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    -- Check if this is the owner account
    IF EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = OLD.user_id
      AND email = 'leewakeman@hotmail.co.uk'
    ) THEN
      -- Silently keep admin role
      NEW.role := 'admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_role_trigger ON public.profiles;

CREATE TRIGGER protect_admin_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_role();

-- ── 2. Fix handle_new_user to not overwrite on conflict ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    role,
    profile_completion_percentage,
    language_preference,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'),
    0,
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'en'),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- NEVER update role on conflict — preserve existing role
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 3. Ensure admin role is set now ──────────────────────────
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'leewakeman@hotmail.co.uk'
  LIMIT 1
);
