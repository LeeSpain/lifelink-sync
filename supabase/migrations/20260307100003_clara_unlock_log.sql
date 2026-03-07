-- CLARA Complete auto-unlock audit log
CREATE TABLE IF NOT EXISTS public.clara_unlock_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('unlocked', 'locked')),
  reason TEXT,
  daily_wellbeing_active BOOLEAN NOT NULL DEFAULT false,
  medication_reminder_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_unlock_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clara log"
  ON public.clara_unlock_log FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can manage clara log"
  ON public.clara_unlock_log FOR ALL USING (is_admin());

CREATE INDEX idx_clara_unlock_log_user_id ON public.clara_unlock_log (user_id);
