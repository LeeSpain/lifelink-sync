-- Voice System Tables: voice_alert_logs, conference_logs, wellbeing_responses

-- Voice Alert Logs — tracks all SOS voice calls
CREATE TABLE IF NOT EXISTS public.voice_alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  trigger_type TEXT,
  contacts_called INTEGER DEFAULT 0,
  call_results JSONB DEFAULT '[]',
  member_called BOOLEAN DEFAULT false,
  member_call_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.voice_alert_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view voice logs' AND tablename = 'voice_alert_logs') THEN
    CREATE POLICY "Admin can view voice logs" ON public.voice_alert_logs FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can insert voice logs' AND tablename = 'voice_alert_logs') THEN
    CREATE POLICY "Service can insert voice logs" ON public.voice_alert_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Conference Logs — tracks conference bridge sessions
CREATE TABLE IF NOT EXISTS public.conference_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  room_name TEXT,
  participants INTEGER DEFAULT 0,
  dial_results JSONB DEFAULT '[]',
  recording_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conference_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view conferences' AND tablename = 'conference_logs') THEN
    CREATE POLICY "Admin can view conferences" ON public.conference_logs FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can insert conferences' AND tablename = 'conference_logs') THEN
    CREATE POLICY "Service can insert conferences" ON public.conference_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Wellbeing Responses — tracks daily check-in answers
CREATE TABLE IF NOT EXISTS public.wellbeing_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  question_type TEXT NOT NULL,
  response_value INTEGER,
  responded_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'voice',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wellbeing_responses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own responses' AND tablename = 'wellbeing_responses') THEN
    CREATE POLICY "Users see own responses" ON public.wellbeing_responses FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin sees all wellbeing' AND tablename = 'wellbeing_responses') THEN
    CREATE POLICY "Admin sees all wellbeing" ON public.wellbeing_responses FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can insert wellbeing' AND tablename = 'wellbeing_responses') THEN
    CREATE POLICY "Service can insert wellbeing" ON public.wellbeing_responses FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Index for dashboard queries
CREATE INDEX idx_wellbeing_user_date
  ON public.wellbeing_responses(user_id, responded_at DESC);
