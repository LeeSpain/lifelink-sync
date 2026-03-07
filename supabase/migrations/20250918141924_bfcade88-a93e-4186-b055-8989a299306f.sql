-- Fix RLS policies for tables with permission errors

-- Drop all existing policies first to ensure clean state
DROP POLICY IF EXISTS "Public can insert video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Admin can view video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Users can manage their selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admin can view all selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admin can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Sales can view leads" ON public.leads;
DROP POLICY IF EXISTS "Public can submit contacts" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin can manage contact submissions" ON public.contact_submissions;

-- Create comprehensive RLS policies for video_analytics
CREATE POLICY "Public can insert video analytics"
ON public.video_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can view video analytics"
ON public.video_analytics
FOR SELECT
USING (is_admin());

CREATE POLICY "System can manage video analytics"
ON public.video_analytics
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create comprehensive RLS policies for registration_selections
CREATE POLICY "Users can manage their selections"
ON public.registration_selections
FOR ALL
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Public can insert selections"
ON public.registration_selections
FOR INSERT
WITH CHECK (true);

-- Create comprehensive RLS policies for leads
CREATE POLICY "Admin can manage leads"
ON public.leads
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Sales can view leads"
ON public.leads
FOR SELECT
USING (is_sales() OR is_admin());

CREATE POLICY "System can manage leads"
ON public.leads
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create comprehensive RLS policies for contact_submissions
CREATE POLICY "Public can submit contacts"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can manage contact submissions"
ON public.contact_submissions
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "System can manage contact submissions"
ON public.contact_submissions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');