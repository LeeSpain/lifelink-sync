-- SECURITY HARDENING MIGRATION (Fixed)
-- 1) Leads: enforce RLS and restrict reads to admin/sales only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Clean up existing policies
DROP POLICY IF EXISTS "Admin can read leads" ON public.leads;
DROP POLICY IF EXISTS "Sales can read leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads (all)" ON public.leads;

-- Re-create precise SELECT permissions
CREATE POLICY "Admins can read leads"
ON public.leads
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Sales can read leads"
ON public.leads
FOR SELECT
USING (public.is_sales() OR public.is_admin());

-- Preserve existing admin management
CREATE POLICY "Admins can manage leads (all)"
ON public.leads
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2) Video analytics: enforce RLS and restrict reads to admins only
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics FORCE ROW LEVEL SECURITY;

-- Clean up existing policies
DROP POLICY IF EXISTS "Admin can view all video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Only admins can view video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Authenticated users can insert video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Users can insert own video analytics" ON public.video_analytics;

-- Recreate policies
CREATE POLICY "Admins can view video analytics"
ON public.video_analytics
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Authenticated users can insert video analytics"
ON public.video_analytics
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR user_id IS NULL);