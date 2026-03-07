-- Complete Priority 1 Security: Secure remaining publicly accessible tables

-- 1) Fix contact_submissions table - restrict reading to admins only
DROP POLICY IF EXISTS "Anyone can read contact submissions" ON public.contact_submissions;

-- Ensure only admins can read contact submissions
CREATE POLICY "Admins only can read contact submissions" ON public.contact_submissions
FOR SELECT 
USING (is_admin());

-- 2) Fix subscribers table - add proper user-specific access
DROP POLICY IF EXISTS "Public can read subscribers" ON public.subscribers;

-- Users can only read their own subscription data
CREATE POLICY "Users can read own subscription" ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id OR auth.email() = email);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions" ON public.subscribers  
FOR SELECT
USING (is_admin());

-- 3) Fix video_analytics table - restrict to admins only
-- First check if there are any public policies to drop
DO $$
BEGIN
  -- Drop any existing public read policies
  DROP POLICY IF EXISTS "Public can read video analytics" ON public.video_analytics;
  DROP POLICY IF EXISTS "Anyone can read video analytics" ON public.video_analytics;
  DROP POLICY IF EXISTS "Public access to video analytics" ON public.video_analytics;
END $$;

-- Ensure video analytics is admin-only for reading
CREATE POLICY "Only admins can read video analytics" ON public.video_analytics
FOR SELECT
USING (is_admin());

-- 4) Fix homepage_analytics table if it exists
DO $$
BEGIN
  -- Check if homepage_analytics table exists and has public read access
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'homepage_analytics') THEN
    -- Drop any public read policies
    DROP POLICY IF EXISTS "Public can read homepage analytics" ON public.homepage_analytics;
    DROP POLICY IF EXISTS "Anyone can read homepage analytics" ON public.homepage_analytics;
    
    -- Only admins can read analytics
    CREATE POLICY "Only admins can read homepage analytics" ON public.homepage_analytics
    FOR SELECT
    USING (is_admin());
  END IF;
END $$;

-- 5) Security audit logging for policy changes
INSERT INTO public.security_events (
  user_id,
  event_type,
  severity,
  source_component,
  metadata,
  created_at
) VALUES (
  NULL,
  'security_policy_hardening',
  'high',
  'database_migration',
  jsonb_build_object(
    'action', 'restricted_public_table_access',
    'tables_secured', ARRAY['contact_submissions', 'subscribers', 'video_analytics', 'homepage_analytics'],
    'timestamp', now()
  ),
  now()
);