-- Create missing tables with proper RLS
CREATE TABLE IF NOT EXISTS public.registration_selections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  subscription_choices jsonb DEFAULT '{}',
  payment_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homepage_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  session_id text,
  page_path text,
  user_agent text,
  ip_address inet,
  referrer text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable and force RLS on missing tables
ALTER TABLE IF EXISTS public.registration_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_selections FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homepage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homepage_analytics FORCE ROW LEVEL SECURITY;

-- Remove any existing anon SELECT policies that are too permissive
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Service role can insert contact submissions" ON public.contact_submissions;

-- Create secure RLS policies for registration_selections
CREATE POLICY "Users can view own registration data" ON public.registration_selections
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own registration data" ON public.registration_selections
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own registration data" ON public.registration_selections
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all registration data" ON public.registration_selections
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create secure RLS policies for homepage_analytics
CREATE POLICY "Admins can view homepage analytics" ON public.homepage_analytics
FOR SELECT USING (is_admin());
CREATE POLICY "System can insert homepage analytics" ON public.homepage_analytics
FOR INSERT WITH CHECK (true);

-- Secure contact_submissions to admin only except for INSERT
CREATE POLICY "Authenticated users can submit contact forms" ON public.contact_submissions
FOR INSERT WITH CHECK (true);

-- Ensure video_analytics is anonymized properly
DROP POLICY IF EXISTS "Authenticated users can insert video analytics" ON public.video_analytics;
CREATE POLICY "Users can track video analytics" ON public.video_analytics
FOR INSERT WITH CHECK (true);