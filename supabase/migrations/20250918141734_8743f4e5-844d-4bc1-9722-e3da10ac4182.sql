-- Fix RLS policies for tables with permission errors

-- Create missing tables if they don't exist and add proper RLS policies
CREATE TABLE IF NOT EXISTS public.video_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  video_title TEXT,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL,
  watch_duration_seconds INTEGER DEFAULT 0,
  user_location JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registration_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  selection_type TEXT NOT NULL,
  selection_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  source TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Video analytics policies
DROP POLICY IF EXISTS "Public can insert video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Admin can view video analytics" ON public.video_analytics;

CREATE POLICY "Public can insert video analytics"
ON public.video_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can view video analytics"
ON public.video_analytics
FOR SELECT
USING (is_admin());

-- Registration selections policies
DROP POLICY IF EXISTS "Users can manage their selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admin can view all selections" ON public.registration_selections;

CREATE POLICY "Users can manage their selections"
ON public.registration_selections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all selections"
ON public.registration_selections
FOR SELECT
USING (is_admin());

-- Leads policies
DROP POLICY IF EXISTS "Admin can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Sales can view leads" ON public.leads;

CREATE POLICY "Admin can manage leads"
ON public.leads
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Sales can view leads"
ON public.leads
FOR SELECT
USING (is_sales() OR is_admin());

-- Contact submissions policies
DROP POLICY IF EXISTS "Public can submit contacts" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admin can view contact submissions" ON public.contact_submissions;

CREATE POLICY "Public can submit contacts"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (is_admin());

CREATE POLICY "Admin can manage contact submissions"
ON public.contact_submissions
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());