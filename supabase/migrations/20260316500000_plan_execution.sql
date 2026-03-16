-- ══════════════════════════════════════════════════════════════
-- Priority 7: Plan Execution — CLARA runs saved plans autonomously
-- ══════════════════════════════════════════════════════════════

-- Track plan execution state
CREATE TABLE IF NOT EXISTS public.clara_plan_executions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                 UUID REFERENCES public.clara_planning_journal(id),
  plan_name               TEXT NOT NULL,
  status                  TEXT DEFAULT 'running',
  -- 'running','paused','complete','failed','cancelled'
  total_steps             INTEGER DEFAULT 0,
  completed_steps         INTEGER DEFAULT 0,
  current_step            INTEGER DEFAULT 1,
  current_step_description TEXT,
  steps_log               JSONB DEFAULT '[]',
  -- array of {step, description, status, result, completed_at}
  started_at              TIMESTAMPTZ DEFAULT now(),
  completed_at            TIMESTAMPTZ,
  paused_at               TIMESTAMPTZ,
  paused_reason           TEXT,
  next_action             TEXT,
  next_action_due         TIMESTAMPTZ
);

-- Track individual step approvals needed
CREATE TABLE IF NOT EXISTS public.clara_plan_approvals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id      UUID REFERENCES public.clara_plan_executions(id),
  step_number       INTEGER NOT NULL,
  step_description  TEXT NOT NULL,
  proposed_action   TEXT NOT NULL,
  approval_status   TEXT DEFAULT 'pending',
  -- 'pending','approved','rejected','skipped'
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clara_plan_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clara_plan_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.clara_plan_executions FOR ALL USING (true);
CREATE POLICY "Service role only" ON public.clara_plan_approvals FOR ALL USING (true);

CREATE INDEX idx_plan_executions_status ON public.clara_plan_executions(status);
CREATE INDEX idx_plan_approvals_execution ON public.clara_plan_approvals(execution_id);
CREATE INDEX idx_plan_approvals_pending ON public.clara_plan_approvals(approval_status) WHERE approval_status = 'pending';

-- Add 'executed' to planning journal status check
-- (existing constraint allows: draft, saved, executing, complete)
-- We need to also allow 'executed' for post-completion state
ALTER TABLE public.clara_planning_journal DROP CONSTRAINT IF EXISTS clara_planning_journal_status_check;
ALTER TABLE public.clara_planning_journal ADD CONSTRAINT clara_planning_journal_status_check
  CHECK (status IN ('draft', 'saved', 'executing', 'complete', 'executed'));

-- Training data for plan execution
INSERT INTO training_data (question, answer, category, is_active, status) VALUES
(
  'How does CLARA execute plans?',
  'CLARA can execute any saved plan automatically. Say "execute [plan name]" on WhatsApp. She parses the plan into steps, runs auto steps herself, asks your approval before sending messages or launching campaigns, and pauses for manual steps that need you. Say "plan status" anytime to check progress. Say "pause plan" to pause, "resume [name]" to continue.',
  'clara_modes',
  true,
  'active'
)
ON CONFLICT DO NOTHING;
