-- ICE SOS Conference Bridge System
-- Tracks live emergency conference calls with real-time participant status

-- Conference rooms table
CREATE TABLE IF NOT EXISTS public.emergency_conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.sos_incidents(id) ON DELETE CASCADE,
  conference_sid TEXT UNIQUE,
  conference_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  user_joined_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  recording_duration INTEGER,
  total_participants INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conference participants table
CREATE TABLE IF NOT EXISTS public.conference_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.emergency_conferences(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'contact', 'ai_agent', 'emergency_service')),
  contact_id UUID,
  call_sid TEXT UNIQUE,
  phone_number TEXT,
  participant_name TEXT,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'calling' CHECK (status IN ('calling', 'ringing', 'in_conference', 'left', 'failed')),
  muted BOOLEAN DEFAULT false,
  hold BOOLEAN DEFAULT false,
  confirmation_message TEXT,
  eta_minutes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conferences_incident ON public.emergency_conferences(incident_id);
CREATE INDEX IF NOT EXISTS idx_conferences_status ON public.emergency_conferences(status);
CREATE INDEX IF NOT EXISTS idx_conferences_started ON public.emergency_conferences(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_conference ON public.conference_participants(conference_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.conference_participants(status);

-- Enable RLS
ALTER TABLE public.emergency_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own conferences" ON public.emergency_conferences;
CREATE POLICY "Users can view their own conferences"
ON public.emergency_conferences FOR SELECT
USING (
  incident_id IN (
    SELECT id FROM public.sos_incidents WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage conferences" ON public.emergency_conferences;
CREATE POLICY "Service role can manage conferences"
ON public.emergency_conferences FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view participants in their conferences" ON public.conference_participants;
CREATE POLICY "Users can view participants in their conferences"
ON public.conference_participants FOR SELECT
USING (
  conference_id IN (
    SELECT id FROM public.emergency_conferences ec
    WHERE ec.incident_id IN (
      SELECT id FROM public.sos_incidents WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Service role can manage participants" ON public.conference_participants;
CREATE POLICY "Service role can manage participants"
ON public.conference_participants FOR ALL
USING (true)
WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_conference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conference_timestamp ON public.emergency_conferences;
CREATE TRIGGER update_conference_timestamp
BEFORE UPDATE ON public.emergency_conferences
FOR EACH ROW EXECUTE FUNCTION update_conference_timestamp();

DROP TRIGGER IF EXISTS update_participant_timestamp ON public.conference_participants;
CREATE TRIGGER update_participant_timestamp
BEFORE UPDATE ON public.conference_participants
FOR EACH ROW EXECUTE FUNCTION update_conference_timestamp();

-- Comments for documentation
COMMENT ON TABLE public.emergency_conferences IS 'Live emergency conference rooms tracking all participants';
COMMENT ON TABLE public.conference_participants IS 'Individual participants in emergency conferences with real-time status';
COMMENT ON COLUMN public.conference_participants.eta_minutes IS 'Estimated time of arrival in minutes for responders';
COMMENT ON COLUMN public.conference_participants.confirmation_message IS 'Responder confirmation captured by AI agent';
