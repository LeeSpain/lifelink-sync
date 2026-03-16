-- Permanent admin guarantee for leewakeman@hotmail.co.uk
-- This migration ensures admin role is set even if a previous
-- trigger, signup flow, or profile recreation reset it.

-- 1. Set admin role now
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'leewakeman@hotmail.co.uk'
);

-- 2. Create a trigger that ALWAYS restores admin role if it gets changed
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this user is the platform owner, force admin role
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = NEW.user_id
    AND email = 'leewakeman@hotmail.co.uk'
  ) THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists and recreate (idempotent)
DROP TRIGGER IF EXISTS trg_protect_admin_role ON public.profiles;
CREATE TRIGGER trg_protect_admin_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_role();

-- 3. Verify
DO $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT p.role INTO v_role
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE au.email = 'leewakeman@hotmail.co.uk';

  IF v_role = 'admin' THEN
    RAISE NOTICE 'CONFIRMED: leewakeman@hotmail.co.uk is admin with trigger protection';
  ELSE
    RAISE WARNING 'Role is "%" — trigger will fix on next write', COALESCE(v_role, 'NULL');
  END IF;
END $$;
