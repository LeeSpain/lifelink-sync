-- Grant necessary permissions for analytics queries to authenticated users
GRANT SELECT ON public.subscribers TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.communication_preferences TO authenticated;
GRANT SELECT ON public.orders TO authenticated;

-- Drop and recreate contact_submissions policies
DROP POLICY IF EXISTS "System can insert contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;

CREATE POLICY "System can insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (is_admin());