-- Admin account setup for leewakeman@hotmail.co.uk
-- Prerequisites: User must first be created via Supabase Dashboard
--   → Authentication → Users → Invite User → leewakeman@hotmail.co.uk
-- Then run this migration to promote to admin role.

-- Ensure role column exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Set admin role by joining through auth.users (profiles has no email column)
UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'leewakeman@hotmail.co.uk'
  LIMIT 1
);

-- Log the admin assignment
INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
SELECT
  au.id,
  'admin_role_assigned',
  'Admin role assigned via migration',
  jsonb_build_object(
    'email', 'leewakeman@hotmail.co.uk',
    'assigned_by', 'migration',
    'migration', '20260309150000_seed_admin_leewakeman'
  )
FROM auth.users au
WHERE au.email = 'leewakeman@hotmail.co.uk'
LIMIT 1;

-- Verify (will show in migration output)
DO $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT p.role INTO v_role
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE au.email = 'leewakeman@hotmail.co.uk';

  IF v_role = 'admin' THEN
    RAISE NOTICE 'SUCCESS: leewakeman@hotmail.co.uk is now admin';
  ELSIF v_role IS NULL THEN
    RAISE WARNING 'User leewakeman@hotmail.co.uk not found — create via Supabase Dashboard first, then re-run';
  ELSE
    RAISE WARNING 'Role is "%" — expected "admin"', v_role;
  END IF;
END $$;
