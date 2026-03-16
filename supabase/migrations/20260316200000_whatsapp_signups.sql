-- R0b: WhatsApp sign-up flow — conversational 3-step onboarding

CREATE TABLE IF NOT EXISTS public.whatsapp_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  step INTEGER NOT NULL DEFAULT 1,
  who_for TEXT,
  full_name TEXT,
  email TEXT,
  language TEXT DEFAULT 'en',
  supabase_user_id UUID,
  stripe_customer_id TEXT,
  trial_activated BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages whatsapp signups"
ON public.whatsapp_signups FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_whatsapp_signups_phone ON public.whatsapp_signups(phone);
CREATE INDEX idx_whatsapp_signups_status ON public.whatsapp_signups(status);
