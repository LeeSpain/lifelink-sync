-- R0a: CLARA Business Ops — pending actions for YES/NO approval flow

CREATE TABLE IF NOT EXISTS public.clara_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_phone TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL DEFAULT '{}',
  proposal_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'executed')),
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.clara_pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages pending actions"
ON public.clara_pending_actions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_clara_pending_status ON public.clara_pending_actions(status, owner_phone);
CREATE INDEX idx_clara_pending_expires ON public.clara_pending_actions(expires_at);
