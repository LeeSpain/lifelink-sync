-- Fix RLS policies for contact_submissions table
-- First, check if the table exists and enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_submissions table
CREATE POLICY "Admins can manage contact submissions" 
ON public.contact_submissions 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "System can insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Also check other analytics tables for proper access
-- Ensure homepage_analytics has proper policies
DROP POLICY IF EXISTS "Only admins can read homepage analytics" ON public.homepage_analytics;
CREATE POLICY "Admins can read all homepage analytics" 
ON public.homepage_analytics 
FOR SELECT 
USING (is_admin());

-- Grant necessary permissions for analytics queries
GRANT SELECT ON public.subscribers TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.communication_preferences TO authenticated;