-- Secure leads table for authorized sales staff only while preserving admin access

-- 1) Helper function to identify sales users (mirrors is_admin)
CREATE OR REPLACE FUNCTION public.is_sales()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COALESCE(public.get_user_role() = 'sales', false);
$function$;

-- 2) Ensure RLS is enabled on leads (idempotent)
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

-- 3) Add policy for sales to read leads, alongside existing admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Sales can read leads'
  ) THEN
    CREATE POLICY "Sales can read leads"
    ON public.leads
    FOR SELECT
    USING (public.is_sales() OR public.is_admin());
  END IF;
END
$$;