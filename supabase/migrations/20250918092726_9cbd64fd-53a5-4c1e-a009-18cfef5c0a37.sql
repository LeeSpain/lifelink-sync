-- Grant necessary permissions for analytics queries to authenticated users
GRANT SELECT ON public.subscribers TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.communication_preferences TO authenticated;
GRANT SELECT ON public.orders TO authenticated;

-- Ensure the is_admin() function works for contact_submissions
-- Drop existing policy and recreate with proper permissions
DROP POLICY IF EXISTS "System can insert contact submissions" ON public.contact_submissions;
CREATE POLICY "System can insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Ensure all analytics-related tables have proper admin access
CREATE POLICY IF NOT EXISTS "Admins can read contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (is_admin());