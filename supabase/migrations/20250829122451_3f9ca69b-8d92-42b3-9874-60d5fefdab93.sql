-- Tighten RLS for contact_submissions to ensure only admins can read; keep public insert
-- 1) Ensure RLS is enabled and enforced
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

-- 2) Clean up duplicate/ambiguous SELECT policies (if present)
DROP POLICY IF EXISTS "Admin can read contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Only admins can view contact submissions" ON public.contact_submissions;

-- 3) Create a single strict admin-only SELECT policy
CREATE POLICY "Admins can read contact submissions"
ON public.contact_submissions
FOR SELECT
USING (public.is_admin());

-- NOTE: We are intentionally not touching existing INSERT policies so public forms continue to work:
--   - "Anyone can insert contact submissions" (WITH CHECK true)
--   - "Service role can insert contact submissions" (WITH CHECK auth.role() = 'service_role')
-- Admin management policies remain in place.
