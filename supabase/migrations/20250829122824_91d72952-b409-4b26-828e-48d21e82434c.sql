-- SECURITY HARDENING MIGRATION
-- 1) Leads: enforce RLS and restrict reads to admin/sales only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Clean up/select policies consolidation
DROP POLICY IF EXISTS "Admin can read leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads; -- not SELECT, but ensure we re-add appropriate ones below if needed
DROP POLICY IF EXISTS "Only admins can manage leads" ON public.leads; -- management handled by ALL policies already
DROP POLICY IF EXISTS "Sales can read leads" ON public.leads;

-- Re-create precise SELECT permissions
CREATE POLICY "Admins can read leads"
ON public.leads
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Sales can read leads"
ON public.leads
FOR SELECT
USING (public.is_sales() OR public.is_admin());

-- Preserve existing admin ALL policies by recreating (idempotent protection)
DROP POLICY IF EXISTS "Admins can manage leads (all)" ON public.leads;
CREATE POLICY "Admins can manage leads (all)"
ON public.leads
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- 2) Video analytics: enforce RLS and restrict reads to admins only; keep insert for authenticated
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics FORCE ROW LEVEL SECURITY;

-- Drop duplicates/clean up
DROP POLICY IF EXISTS "Admin can view all video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Only admins can view video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Authenticated users can insert video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Users can insert own video analytics" ON public.video_analytics;

-- Recreate consolidated policies
CREATE POLICY "Admins can view video analytics"
ON public.video_analytics
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Authenticated users can insert video analytics"
ON public.video_analytics
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR user_id IS NULL);


-- 3) Phone verifications: if table exists, enforce RLS, restrict visibility, and attach validation trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' AND tablename = 'phone_verifications'
  ) THEN
    -- Enforce RLS
    EXECUTE 'ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY';

    -- Clean up existing overly permissive policies if any
    EXECUTE 'DROP POLICY IF EXISTS "Public can read phone verifications" ON public.phone_verifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their phone verifications" ON public.phone_verifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage phone verifications" ON public.phone_verifications';

    -- Service role read-only (no client reads)
    EXECUTE $$
      CREATE POLICY "Service role can read phone verifications"
      ON public.phone_verifications
      FOR SELECT
      USING (auth.role() = 'service_role')
    $$;

    -- Users can only INSERT their own records
    EXECUTE $$
      CREATE POLICY "Users can create own phone verifications"
      ON public.phone_verifications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $$;

    -- Attach validation trigger if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'validate_phone_verification_trigger'
    ) THEN
      EXECUTE 'CREATE TRIGGER validate_phone_verification_trigger
        BEFORE INSERT ON public.phone_verifications
        FOR EACH ROW EXECUTE FUNCTION public.validate_phone_verification()';
    END IF;
  END IF;
END
$$;
