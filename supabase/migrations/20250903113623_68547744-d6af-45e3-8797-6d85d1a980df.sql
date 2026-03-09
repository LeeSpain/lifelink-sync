-- Secure registration_selections: admin or owner only

-- Ensure RLS is enabled
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for admin and owner
DROP POLICY IF EXISTS "Admins can manage registration selections" ON public.registration_selections;
CREATE POLICY "Admins can manage registration selections"
ON public.registration_selections
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users can manage own registration selections" ON public.registration_selections;
CREATE POLICY "Users can manage own registration selections"
ON public.registration_selections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a restrictive policy to neutralize any existing permissive public policies
DROP POLICY IF EXISTS "Restrict registration selections to admin or owner" ON public.registration_selections;
CREATE POLICY "Restrict registration selections to admin or owner"
ON public.registration_selections
AS RESTRICTIVE
FOR ALL
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);
