-- Outreach messages table — tracks every outreach attempt (sent, blocked, failed)
CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','blocked','failed','delivered','bounced')),
  blocked_reason TEXT,
  source_function TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view outreach messages" ON public.outreach_messages;
CREATE POLICY "Admins can view outreach messages"
ON public.outreach_messages FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role full access to outreach messages" ON public.outreach_messages;
CREATE POLICY "Service role full access to outreach messages"
ON public.outreach_messages FOR ALL
USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_outreach_messages_lead_id
  ON public.outreach_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status
  ON public.outreach_messages(status);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_created_at
  ON public.outreach_messages(created_at DESC);
