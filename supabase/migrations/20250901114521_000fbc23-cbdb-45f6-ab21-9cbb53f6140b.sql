-- Fix duplicate policy issue and continue with security fixes

-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can manage their own registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admins can manage all registration selections" ON public.registration_selections;

-- Recreate the policies properly
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

-- Now let's check if we need the SOS tables that failed earlier
CREATE TABLE IF NOT EXISTS public.sos_incidents (
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

CREATE TABLE IF NOT EXISTS public.sos_call_attempts (
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

-- Enable RLS on SOS tables (if they don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_incidents') THEN
    EXECUTE 'ALTER TABLE public.sos_incidents ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_call_attempts') THEN
    EXECUTE 'ALTER TABLE public.sos_call_attempts ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Create missing policies for SOS tables
DO $$
BEGIN
  -- SOS Incidents policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_incidents') THEN
    BEGIN
      EXECUTE 'CREATE POLICY "Users can manage their own SOS incidents" ON public.sos_incidents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists
    END;
    
    BEGIN
      EXECUTE 'CREATE POLICY "Admins can manage all SOS incidents" ON public.sos_incidents FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists
    END;
  END IF;

  -- SOS Call Attempts policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_call_attempts') THEN
    BEGIN
      EXECUTE 'CREATE POLICY "Users can view call attempts for their incidents" ON public.sos_call_attempts FOR SELECT USING (EXISTS (SELECT 1 FROM public.sos_incidents si WHERE si.id = sos_call_attempts.incident_id AND si.user_id = auth.uid()))';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists
    END;
    
    BEGIN
      EXECUTE 'CREATE POLICY "Admins can manage all call attempts" ON public.sos_call_attempts FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists  
    END;
    
    BEGIN
      EXECUTE 'CREATE POLICY "System can manage call attempts" ON public.sos_call_attempts FOR ALL USING (true) WITH CHECK (true)';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists
    END;
  END IF;
END $$;

-- Add indexes for performance (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_incidents') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'sos_incidents' AND indexname = 'idx_sos_incidents_user_id') THEN
      CREATE INDEX idx_sos_incidents_user_id ON public.sos_incidents(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'sos_incidents' AND indexname = 'idx_sos_incidents_status') THEN
      CREATE INDEX idx_sos_incidents_status ON public.sos_incidents(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'sos_incidents' AND indexname = 'idx_sos_incidents_created_at') THEN
      CREATE INDEX idx_sos_incidents_created_at ON public.sos_incidents(created_at);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sos_call_attempts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'sos_call_attempts' AND indexname = 'idx_sos_call_attempts_incident_id') THEN
      CREATE INDEX idx_sos_call_attempts_incident_id ON public.sos_call_attempts(incident_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'sos_call_attempts' AND indexname = 'idx_sos_call_attempts_call_sid') THEN
      CREATE INDEX idx_sos_call_attempts_call_sid ON public.sos_call_attempts(call_sid);
    END IF;
  END IF;
END $$;