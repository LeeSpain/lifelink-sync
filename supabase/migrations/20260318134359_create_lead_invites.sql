-- Lead invites table: tracks invite tokens, delivery channels, and conversion funnel
CREATE TABLE IF NOT EXISTS public.lead_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),

  -- Channels sent
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  sms_sid TEXT,

  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_message_id TEXT,

  messenger_sent BOOLEAN DEFAULT false,
  messenger_sent_at TIMESTAMPTZ,
  messenger_recipient_id TEXT,

  -- Engagement tracking
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  clicked_channel TEXT,
  click_count INTEGER DEFAULT 0,

  -- Conversion
  whatsapp_started BOOLEAN DEFAULT false,
  whatsapp_started_at TIMESTAMPTZ,
  messenger_started BOOLEAN DEFAULT false,
  messenger_started_at TIMESTAMPTZ,
  sms_replied BOOLEAN DEFAULT false,
  sms_replied_at TIMESTAMPTZ,

  trial_started BOOLEAN DEFAULT false,
  trial_started_at TIMESTAMPTZ,
  subscribed BOOLEAN DEFAULT false,
  subscribed_at TIMESTAMPTZ,

  -- Meta
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage lead invites"
ON public.lead_invites FOR ALL
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can read invite by token"
ON public.lead_invites FOR SELECT
USING (true);

CREATE INDEX IF NOT EXISTS idx_lead_invites_token ON public.lead_invites(token);
CREATE INDEX IF NOT EXISTS idx_lead_invites_lead_id ON public.lead_invites(lead_id);

CREATE TRIGGER update_lead_invites_updated_at
  BEFORE UPDATE ON public.lead_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
