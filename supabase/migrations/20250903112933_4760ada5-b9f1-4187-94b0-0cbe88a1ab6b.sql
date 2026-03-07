-- Tighten RLS on contact_submissions to admin-only and remove redundant policies

-- Ensure RLS is enabled
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing redundant/overly permissive policies safely
DROP POLICY IF EXISTS "Admin can delete contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin can manage all contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins only can read contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can submit contact forms" ON public.contact_submissions;
DROP POLICY IF EXISTS "admins_only_contact_submissions" ON public.contact_submissions;

-- Create a single strict policy: only admins can read/write
CREATE POLICY "Admins only contact_submissions"
ON public.contact_submissions
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
