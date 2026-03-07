-- Fix critical security vulnerabilities by adding proper RLS policies

-- Fix contact_submissions table - restrict to admin access only
DROP POLICY IF EXISTS "Users can insert contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Users can view own contact submissions" ON public.contact_submissions;

CREATE POLICY "Only admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Anyone can insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Fix phone_verifications table - restrict to user's own data
DROP POLICY IF EXISTS "Users can manage own phone verifications" ON public.phone_verifications;

CREATE POLICY "Users can view own phone verifications" 
ON public.phone_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone verifications" 
ON public.phone_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone verifications" 
ON public.phone_verifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fix registration_selections table - restrict to user's own data
DROP POLICY IF EXISTS "System can manage registration selections" ON public.registration_selections;

CREATE POLICY "Users can view own registration selections" 
ON public.registration_selections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registration selections" 
ON public.registration_selections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration selections" 
ON public.registration_selections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registration selections" 
ON public.registration_selections 
FOR ALL 
USING (public.is_admin());

-- Fix leads table - restrict to admin access only
DROP POLICY IF EXISTS "Users can manage leads" ON public.leads;

CREATE POLICY "Only admins can manage leads" 
ON public.leads 
FOR ALL 
USING (public.is_admin());

-- Fix video_analytics table - restrict to admin access only
DROP POLICY IF EXISTS "Users can insert video analytics" ON public.video_analytics;

CREATE POLICY "Users can insert own video analytics" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Only admins can view video analytics" 
ON public.video_analytics 
FOR SELECT 
USING (public.is_admin());