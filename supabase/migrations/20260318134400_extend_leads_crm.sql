-- Link unified_conversations back to leads
ALTER TABLE public.unified_conversations
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_token TEXT;

CREATE INDEX IF NOT EXISTS idx_unified_conversations_lead_id
  ON public.unified_conversations(lead_id);

-- Link subscribers back to leads
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subscribers_lead_id
  ON public.subscribers(lead_id);

-- Extend leads with invite tracking columns
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'not_invited'
    CHECK (invite_status IN ('not_invited','invited','clicked','talking','trial','subscribed','lost')),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_click_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_channel TEXT,
  ADD COLUMN IF NOT EXISTS facebook_psid TEXT,
  ADD COLUMN IF NOT EXISTS referred_by TEXT DEFAULT 'lee_wakeman';

-- Update lead score trigger on invite milestones
CREATE OR REPLACE FUNCTION update_lead_score_on_invite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clicked = true AND (OLD.clicked IS NULL OR OLD.clicked = false) THEN
    UPDATE public.leads SET
      lead_score = LEAST(COALESCE(lead_score, 0) + 20, 100),
      invite_status = 'clicked',
      first_click_at = now()
    WHERE id = NEW.lead_id;
  END IF;
  IF NEW.trial_started = true AND (OLD.trial_started IS NULL OR OLD.trial_started = false) THEN
    UPDATE public.leads SET
      lead_score = LEAST(COALESCE(lead_score, 0) + 40, 100),
      invite_status = 'trial',
      trial_started_at = now()
    WHERE id = NEW.lead_id;
  END IF;
  IF NEW.subscribed = true AND (OLD.subscribed IS NULL OR OLD.subscribed = false) THEN
    UPDATE public.leads SET
      lead_score = 100,
      invite_status = 'subscribed',
      subscribed_at = now()
    WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

DROP TRIGGER IF EXISTS trigger_lead_score_on_invite ON public.lead_invites;
CREATE TRIGGER trigger_lead_score_on_invite
  AFTER UPDATE ON public.lead_invites
  FOR EACH ROW EXECUTE FUNCTION update_lead_score_on_invite();
