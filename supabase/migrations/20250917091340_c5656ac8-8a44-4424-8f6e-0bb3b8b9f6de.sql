-- CRITICAL SECURITY FIX: Enable RLS on publicly accessible tables with sensitive data

-- Fix 1: Secure contact_submissions table (contains customer PII)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view contact submissions
CREATE POLICY "Admin can manage contact submissions" 
ON public.contact_submissions 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Allow public to insert contact submissions (for contact forms)
CREATE POLICY "Public can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Fix 2: Secure leads table (contains sensitive sales data)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only admins and sales can access leads
CREATE POLICY "Admin and sales can manage leads" 
ON public.leads 
FOR ALL 
USING (is_admin() OR is_sales()) 
WITH CHECK (is_admin() OR is_sales());

-- Fix 3: Secure video_analytics table (contains user tracking data)
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can view analytics data
CREATE POLICY "Admin can view video analytics" 
ON public.video_analytics 
FOR SELECT 
USING (is_admin());

-- System can insert analytics (for tracking)
CREATE POLICY "System can insert video analytics" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (true);

-- Fix 4: Secure registration_selections table (contains customer data)
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

-- Users can only view their own registration data
CREATE POLICY "Users can view own registration data" 
ON public.registration_selections 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own registration data
CREATE POLICY "Users can insert own registration data" 
ON public.registration_selections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own registration data
CREATE POLICY "Users can update own registration data" 
ON public.registration_selections 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all registration data
CREATE POLICY "Admin can manage all registration data" 
ON public.registration_selections 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());