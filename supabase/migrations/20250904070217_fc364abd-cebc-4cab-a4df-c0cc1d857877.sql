-- Phase 1 Security Fixes (Supplemental): Lock down contact_submissions and video_analytics, and anonymize IPs

-- 1) contact_submissions – admin-only access; inserts via service role (edge function)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Clean up any prior policies
DROP POLICY IF EXISTS "Admins can manage contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "System can insert contact submissions" ON public.contact_submissions;

-- Admins manage for support/audit
CREATE POLICY "Admins can manage contact submissions"
ON public.contact_submissions
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Edge functions (service role) insert submissions
CREATE POLICY "System can insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');


-- 2) video_analytics – restrict writes to service role; admins can view
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "System can insert video analytics" ON public.video_analytics;

CREATE POLICY "Admins can view video analytics"
ON public.video_analytics
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "System can insert video analytics"
ON public.video_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- 2a) Ensure IP is anonymized on ingest
DROP TRIGGER IF EXISTS anonymize_video_analytics_ip_trigger ON public.video_analytics;
CREATE TRIGGER anonymize_video_analytics_ip_trigger
BEFORE INSERT ON public.video_analytics
FOR EACH ROW
EXECUTE FUNCTION public.anonymize_video_analytics_ip();
