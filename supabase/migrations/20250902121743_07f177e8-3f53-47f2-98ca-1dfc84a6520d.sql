-- Fix critical security issues by adding RLS policies

-- 1. Fix phone_verifications table security
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_phone_verifications" ON public.phone_verifications
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Fix contact_submissions table security  
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_only_contact_submissions" ON public.contact_submissions
FOR SELECT
USING (public.is_admin());

-- 3. Fix leads table security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_and_sales_access_leads" ON public.leads
FOR ALL
USING (public.is_admin() OR public.is_sales());

-- 4. Fix video_analytics table security
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_only_video_analytics" ON public.video_analytics
FOR ALL
USING (public.is_admin());

-- 5. Fix registration_selections table security
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_registrations" ON public.registration_selections
FOR ALL
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- 6. Fix communication_metrics_summary table security
ALTER TABLE public.communication_metrics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_only_communication_metrics" ON public.communication_metrics_summary
FOR ALL
USING (public.is_admin());