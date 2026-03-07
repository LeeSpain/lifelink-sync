-- Add sales-only access to leads without broadening exposure
-- 1) Ensure RLS is enabled and forced on leads (idempotent)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- 2) Helper function to check sales role using existing role mechanism
CREATE OR REPLACE FUNCTION public.is_sales()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(public.get_user_role() = 'sales', false);
$$;

-- 3) Allow only sales (and admins via existing policies) to read leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='leads' AND policyname='Sales can read leads'
  ) THEN
    CREATE POLICY "Sales can read leads"
    ON public.leads
    FOR SELECT
    USING (public.is_sales());
  END IF;
END
$$;