-- Trial tracking: one trial per user, no card required
CREATE TABLE IF NOT EXISTS public.trial_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  converted_at TIMESTAMPTZ,
  plan_after_trial TEXT,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial"
  ON public.trial_tracking FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trial"
  ON public.trial_tracking FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage trials"
  ON public.trial_tracking FOR ALL USING (is_admin());

CREATE INDEX idx_trial_tracking_status_end ON public.trial_tracking (status, trial_end);
