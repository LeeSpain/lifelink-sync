-- Create followup sequences system for hot lead automation

-- Table: followup_sequences
CREATE TABLE public.followup_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: followup_steps
CREATE TABLE public.followup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  delay_minutes int NOT NULL,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: followup_enrollments
CREATE TABLE public.followup_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
  current_step int NOT NULL DEFAULT 1,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  next_send_at timestamptz NOT NULL,
  last_sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, lead_id)
);

-- Table: followup_send_log
CREATE TABLE public.followup_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.followup_enrollments(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  queued_email_id uuid NULL,
  status text NOT NULL CHECK (status IN ('queued', 'skipped', 'failed')),
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_send_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sequences/steps: authenticated users can read
CREATE POLICY "Authenticated users can read sequences"
ON public.followup_sequences FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read steps"
ON public.followup_steps FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for enrollments: access via lead ownership
CREATE POLICY "Users can view enrollments for their leads"
ON public.followup_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = followup_enrollments.lead_id 
    AND leads.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Users can insert enrollments for their leads"
ON public.followup_enrollments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = followup_enrollments.lead_id 
    AND leads.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Users can update enrollments for their leads"
ON public.followup_enrollments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = followup_enrollments.lead_id 
    AND leads.user_id = auth.uid()
  )
  OR is_admin()
);

-- RLS Policies for send logs
CREATE POLICY "Users can view send logs for their enrollments"
ON public.followup_send_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.followup_enrollments e
    JOIN public.leads l ON l.id = e.lead_id
    WHERE e.id = followup_send_log.enrollment_id 
    AND l.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Users can insert send logs for their enrollments"
ON public.followup_send_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.followup_enrollments e
    JOIN public.leads l ON l.id = e.lead_id
    WHERE e.id = followup_send_log.enrollment_id 
    AND l.user_id = auth.uid()
  )
  OR is_admin()
);

-- Indexes for performance
CREATE INDEX idx_followup_steps_sequence ON public.followup_steps(sequence_id, step_order);
CREATE INDEX idx_followup_enrollments_next_send ON public.followup_enrollments(status, next_send_at) WHERE status = 'active';
CREATE INDEX idx_followup_enrollments_lead ON public.followup_enrollments(lead_id);
CREATE INDEX idx_followup_send_log_enrollment ON public.followup_send_log(enrollment_id);

-- Seed default Hot Lead sequence
INSERT INTO public.followup_sequences (id, name, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'Lead Intel - Hot Intro Sequence', true);

-- Seed 3 steps
INSERT INTO public.followup_steps (sequence_id, step_order, delay_minutes, subject_template, body_template)
VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  1,
  0,
  'Quick question about safety for {{company}}',
  E'Hi {{name}},\n\nI noticed your organisation might benefit from a simple, reliable emergency SOS solution.\n\nICE SOS Lite helps teams:\n• Send instant SOS alerts with GPS location\n• Keep medical info accessible in emergencies\n• Connect family and care circles for peace of mind\n\nWould you be open to a quick 10-minute call to see if this could help {{company}}?\n\nBest regards,\nThe ICE SOS Team\n\n---\nIf you prefer not to hear from us, reply \"unsubscribe\".'
),
(
  '11111111-1111-1111-1111-111111111111',
  2,
  1440,
  'How teams handle SOS alerts in seconds',
  E'Hi {{name}},\n\nJust a quick follow-up.\n\nWe recently helped a care organisation reduce their emergency response time from minutes to seconds using ICE SOS Lite.\n\nThe difference? One-tap SOS buttons that instantly alert the right people with exact location.\n\nIf this sounds useful for {{company}}, I''d be happy to share more details.\n\nBest,\nThe ICE SOS Team\n\n---\nIf you prefer not to hear from us, reply \"unsubscribe\".'
),
(
  '11111111-1111-1111-1111-111111111111',
  3,
  4320,
  'Should I send details or set a 10-minute call?',
  E'Hi {{name}},\n\nI wanted to check in one last time.\n\nIf safety monitoring is on your radar, I''m happy to:\n• Send over a quick product overview\n• Schedule a brief 10-minute call at your convenience\n\nJust let me know what works best, or feel free to ignore this if the timing isn''t right.\n\nTake care,\nThe ICE SOS Team\n\n---\nIf you prefer not to hear from us, reply \"unsubscribe\".'
);