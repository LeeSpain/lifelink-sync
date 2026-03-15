-- CLARA Superpowers — tasks, planning journal, PA actions

CREATE TABLE IF NOT EXISTS public.clara_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','done','cancelled')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.clara_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages tasks" ON public.clara_tasks FOR ALL
USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX idx_clara_tasks_status ON public.clara_tasks(status);

CREATE TABLE IF NOT EXISTS public.clara_planning_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','saved','executing','complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_planning_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages journal" ON public.clara_planning_journal FOR ALL
USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.clara_pa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL
    CHECK (action_type IN ('whatsapp','email','booking','task','research')),
  recipient_name TEXT,
  recipient_contact TEXT,
  message_sent TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','failed','pending')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by_lee BOOLEAN DEFAULT true
);

ALTER TABLE public.clara_pa_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages pa actions" ON public.clara_pa_actions FOR ALL
USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Extend clara_admin_mode with all new modes
ALTER TABLE public.clara_admin_mode
  DROP CONSTRAINT IF EXISTS clara_admin_mode_current_mode_check;

ALTER TABLE public.clara_admin_mode
  ADD CONSTRAINT clara_admin_mode_current_mode_check
  CHECK (current_mode IN ('business','dev','pa','planning','sales','marketing','ops'));
