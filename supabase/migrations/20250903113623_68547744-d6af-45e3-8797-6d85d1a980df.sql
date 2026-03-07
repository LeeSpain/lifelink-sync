-- Secure registration_selections: admin or owner only

-- Ensure RLS is enabled
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for admin and owner
CREATE POLICY IF NOT EXISTS "Admins can manage registration selections"
ON public.registration_selections
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY IF NOT EXISTS "Users can manage own registration selections"
ON public.registration_selections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a restrictive policy to neutralize any existing permissive public policies
CREATE POLICY IF NOT EXISTS "Restrict registration selections to admin or owner"
AS RESTRICTIVE
ON public.registration_selections
FOR ALL
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);
