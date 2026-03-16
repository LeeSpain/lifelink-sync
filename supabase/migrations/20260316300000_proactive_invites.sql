-- R0c: Proactive personalised invites with 10-day follow-up sequence

CREATE TABLE IF NOT EXISTS public.proactive_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiated_by TEXT NOT NULL DEFAULT 'lee',
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  who_for TEXT NOT NULL DEFAULT 'unsure',
  personalisation_context TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  sequence_day INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'converted', 'opted_out', 'completed')),
  converted_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ DEFAULT now(),
  next_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proactive_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages proactive invites"
ON public.proactive_invites FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_proactive_invites_status ON public.proactive_invites(status);
CREATE INDEX idx_proactive_invites_next ON public.proactive_invites(next_contact_at);
CREATE INDEX idx_proactive_invites_phone ON public.proactive_invites(contact_phone);

-- Cron: process invite sequence daily at 10am UTC
SELECT cron.schedule(
  'proactive-invite-sequence',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/proactive-invite',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"action":"process_sequence"}'::jsonb
  );
  $$
);
