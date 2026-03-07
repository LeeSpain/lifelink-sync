-- Secure registration_selections: admin or owner only (drop/create)

ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies by common names (no-op if missing)
DROP POLICY IF EXISTS "Admins can manage registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Users can manage own registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Restrict registration selections to admin or owner" ON public.registration_selections;
DROP POLICY IF EXISTS "Public can read registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Anyone can read registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "public_read_registration_selections" ON public.registration_selections;

-- Create permissive policies
CREATE POLICY "Admins can manage registration selections"
ON public.registration_selections
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage own registration selections"
ON public.registration_selections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create restrictive policy to ensure only admin or owner even if other permissive policies exist
CREATE POLICY "Restrict registration selections to admin or owner"
AS RESTRICTIVE
ON public.registration_selections
FOR ALL
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);
