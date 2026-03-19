-- Add Hunter.io enrichment columns to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS research_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_confidence TEXT DEFAULT 'unknown'
    CHECK (contact_confidence IN ('verified','likely','guessed','unknown')),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS email_verification_status TEXT
    CHECK (email_verification_status IN ('valid','invalid','risky','unknown')),
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_email_verified
  ON public.leads(email_verified);
CREATE INDEX IF NOT EXISTS idx_leads_contact_confidence
  ON public.leads(contact_confidence);
CREATE INDEX IF NOT EXISTS idx_leads_email_verification_status
  ON public.leads(email_verification_status);

-- API keys table for third-party integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_day INTEGER,
  requests_today INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write api_keys
DROP POLICY IF EXISTS "Admins can manage api_keys" ON public.api_keys;
CREATE POLICY "Admins can manage api_keys"
ON public.api_keys FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role can always access (for edge functions)
DROP POLICY IF EXISTS "Service role full access to api_keys" ON public.api_keys;
CREATE POLICY "Service role full access to api_keys"
ON public.api_keys FOR ALL
USING (auth.role() = 'service_role');

-- Auto-reset daily counter
CREATE OR REPLACE FUNCTION reset_api_key_daily_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_reset_at::date < now()::date THEN
    NEW.requests_today := 0;
    NEW.last_reset_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

DROP TRIGGER IF EXISTS trigger_reset_api_key_counter ON public.api_keys;
CREATE TRIGGER trigger_reset_api_key_counter
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION reset_api_key_daily_counter();

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trigger_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lead enrichment activity log
CREATE TABLE IF NOT EXISTS public.lead_enrichment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  source TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_enrichment_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view enrichment logs" ON public.lead_enrichment_log;
CREATE POLICY "Admins can view enrichment logs"
ON public.lead_enrichment_log FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role full access to enrichment logs" ON public.lead_enrichment_log;
CREATE POLICY "Service role full access to enrichment logs"
ON public.lead_enrichment_log FOR ALL
USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_enrichment_log_lead_id
  ON public.lead_enrichment_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_log_created_at
  ON public.lead_enrichment_log(created_at DESC);
