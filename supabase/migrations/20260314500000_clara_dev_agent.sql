-- ── dev_agent_log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_agent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  command_text TEXT NOT NULL,
  clara_intent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_confirm',
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  branch_name TEXT,
  pr_number INTEGER,
  pr_url TEXT,
  files_read TEXT[] DEFAULT '{}',
  files_changed TEXT[] DEFAULT '{}',
  diff_summary TEXT,
  deploy_url TEXT,
  error_message TEXT,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dev_agent_log_status
  ON public.dev_agent_log(status);
CREATE INDEX idx_dev_agent_log_created
  ON public.dev_agent_log(created_at DESC);

ALTER TABLE public.dev_agent_log
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only dev agent log"
ON public.dev_agent_log FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role dev agent log"
ON public.dev_agent_log FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── dev_agent_sessions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'awaiting_confirm',
  command_text TEXT NOT NULL,
  clara_intent TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
    DEFAULT (now() + interval '5 minutes'),
  log_id UUID REFERENCES public.dev_agent_log(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dev_agent_sessions_status
  ON public.dev_agent_sessions(status);
CREATE INDEX idx_dev_agent_sessions_expires
  ON public.dev_agent_sessions(expires_at);

ALTER TABLE public.dev_agent_sessions
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role dev agent sessions"
ON public.dev_agent_sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
