-- Secure registration_selections table with proper RLS policies

-- Ensure RLS is enabled
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

-- Remove any existing overly permissive policies
DROP POLICY IF EXISTS "Public can read registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Anyone can read registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "public_read_registration_selections" ON public.registration_selections;

-- Create secure policies: admin can do everything, users can only access their own data
CREATE POLICY "Admin can manage all registration selections"
ON public.registration_selections
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view own registration selections"
ON public.registration_selections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registration selections"
ON public.registration_selections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration selections"
ON public.registration_selections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);