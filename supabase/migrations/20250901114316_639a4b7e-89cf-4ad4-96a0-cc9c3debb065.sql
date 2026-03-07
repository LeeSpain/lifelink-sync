-- Create missing SOS tables for emergency tracking
CREATE TABLE public.sos_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_data JSONB NOT NULL DEFAULT '{}',
  emergency_contacts_notified INTEGER DEFAULT 0,
  calls_initiated INTEGER DEFAULT 0,
  calls_answered INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  incident_metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.sos_call_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  call_sid TEXT UNIQUE,
  call_status TEXT DEFAULT 'initiated',
  call_duration INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on SOS tables
ALTER TABLE public.sos_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_call_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sos_incidents
CREATE POLICY "Users can manage their own SOS incidents" 
ON public.sos_incidents 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all SOS incidents" 
ON public.sos_incidents 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for sos_call_attempts  
CREATE POLICY "Users can view call attempts for their incidents" 
ON public.sos_call_attempts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sos_incidents si 
  WHERE si.id = sos_call_attempts.incident_id 
    AND si.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all call attempts" 
ON public.sos_call_attempts 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "System can manage call attempts" 
ON public.sos_call_attempts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_sos_incidents_user_id ON public.sos_incidents(user_id);
CREATE INDEX idx_sos_incidents_status ON public.sos_incidents(status);
CREATE INDEX idx_sos_incidents_created_at ON public.sos_incidents(created_at);
CREATE INDEX idx_sos_call_attempts_incident_id ON public.sos_call_attempts(incident_id);
CREATE INDEX idx_sos_call_attempts_call_sid ON public.sos_call_attempts(call_sid);

-- Add triggers for updated_at
CREATE TRIGGER update_sos_incidents_updated_at
BEFORE UPDATE ON public.sos_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sos_call_attempts_updated_at
BEFORE UPDATE ON public.sos_call_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix critical RLS security vulnerabilities
-- 1. Fix contact_submissions (currently allows public read)
DROP POLICY IF EXISTS "Anyone can view contact submissions" ON public.contact_submissions;

-- 2. Fix video_analytics (currently allows public insert)  
DROP POLICY IF EXISTS "Anyone can insert video analytics" ON public.video_analytics;
CREATE POLICY "Service role can insert video analytics" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 3. Restrict phone_verifications to user's own data only
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Create registration_selections table with proper RLS
CREATE TABLE IF NOT EXISTS public.registration_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  selected_products JSONB DEFAULT '[]',
  total_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own registration selections" 
ON public.registration_selections 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registration selections" 
ON public.registration_selections 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());