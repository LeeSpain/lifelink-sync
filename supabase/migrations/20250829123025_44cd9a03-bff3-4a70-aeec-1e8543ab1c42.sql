-- Security hardening for remaining tables (with proper cleanup)

-- 1) registration_selections table
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections FORCE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can read registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Users can create own registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admins can manage registration selections" ON public.registration_selections;

-- Create new secure policies
CREATE POLICY "Admins can read registration selections"
ON public.registration_selections
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can create own registration selections"
ON public.registration_selections
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage registration selections"
ON public.registration_selections
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2) phone_verifications table
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Service role can read phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can create own phone verifications" ON public.phone_verifications;

-- Create new secure policies
CREATE POLICY "Service role can read phone verifications"
ON public.phone_verifications
FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Users can create own phone verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);