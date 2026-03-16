-- ══════════════════════════════════════════════════════════════
-- Priority 10: R1-R7 — CLARA as Riven's Boss (Autonomous CMO)
-- ══════════════════════════════════════════════════════════════

-- R1: Command queue — CLARA writes, Riven reads and executes
CREATE TABLE IF NOT EXISTS public.clara_riven_commands (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_type  TEXT NOT NULL,
  command_data  JSONB NOT NULL DEFAULT '{}',
  priority      INTEGER DEFAULT 3,
  status        TEXT DEFAULT 'pending',
  created_by    TEXT DEFAULT 'clara',
  picked_up_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  result        JSONB DEFAULT '{}',
  error_text    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- R1: Riven performance log
CREATE TABLE IF NOT EXISTS public.riven_performance (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type        TEXT,
  content_preview     TEXT,
  audience_segment    TEXT,
  sent_count          INTEGER DEFAULT 0,
  open_count          INTEGER DEFAULT 0,
  reply_count         INTEGER DEFAULT 0,
  conversion_count    INTEGER DEFAULT 0,
  engagement_rate     NUMERIC,
  revenue_attributed  NUMERIC DEFAULT 0,
  period_start        TIMESTAMPTZ,
  period_end          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- R7: Budget control
CREATE TABLE IF NOT EXISTS public.clara_budget (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_type      TEXT NOT NULL UNIQUE,
  limit_amount     NUMERIC NOT NULL,
  spent_amount     NUMERIC DEFAULT 0,
  period_start     TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  period_end       TIMESTAMPTZ DEFAULT date_trunc('month', now()) + interval '1 month',
  alert_threshold  NUMERIC DEFAULT 0.8,
  is_locked        BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.clara_riven_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riven_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clara_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.clara_riven_commands FOR ALL USING (true);
CREATE POLICY "Service role only" ON public.riven_performance FOR ALL USING (true);
CREATE POLICY "Service role only" ON public.clara_budget FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_riven_commands_status ON public.clara_riven_commands(status);
CREATE INDEX idx_riven_commands_type ON public.clara_riven_commands(command_type);
CREATE INDEX idx_riven_performance_type ON public.riven_performance(content_type, created_at DESC);
CREATE INDEX idx_clara_budget_type ON public.clara_budget(budget_type);

-- Seed default budgets
INSERT INTO public.clara_budget (budget_type, limit_amount) VALUES
  ('weekly_campaigns', 50.00),
  ('monthly_outreach', 100.00),
  ('content_creation', 25.00),
  ('total_monthly', 200.00)
ON CONFLICT (budget_type) DO NOTHING;

-- Cron: Riven command processor every 15 minutes
SELECT cron.schedule(
  'riven-command-processor',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/clara-riven',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{"action":"process_commands"}'::jsonb
  );
  $$
);

-- Cron: Email triggers daily 9am UTC
SELECT cron.schedule(
  'clara-email-triggers',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/clara-email-engine',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{"action":"run_triggers"}'::jsonb
  );
  $$
);

-- Cron: Weekly content generation Monday 7am UTC
SELECT cron.schedule(
  'clara-weekly-content',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/clara-content-engine',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{"action":"generate_weekly"}'::jsonb
  );
  $$
);

-- Cron: Outreach engine every 6 hours
SELECT cron.schedule(
  'clara-outreach-engine',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/clara-outreach-engine',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{"action":"process_cold_leads"}'::jsonb
  );
  $$
);

-- Cron: CMO report Monday 8am UTC
SELECT cron.schedule(
  'clara-cmo-report',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/clara-cmo-report',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{"action":"send_report"}'::jsonb
  );
  $$
);

-- Training data
INSERT INTO training_data (question, answer, category, is_active, status) VALUES
(
  'What is Riven?',
  'Riven is LifeLink Sync''s autonomous marketing system. CLARA acts as Riven''s CMO — she decides what to do and Riven executes it. CLARA runs campaigns, responds to social DMs, generates weekly content, re-engages cold leads, sends email sequences, and reports performance every Monday. All within budget limits Lee sets. Lee approves major actions, CLARA handles everything else.',
  'clara_modes',
  true,
  'active'
),
(
  'How does CLARA manage the budget?',
  'CLARA checks budget limits before any spend. Say "budget" to see current spend vs limits. Say "set [type] budget to [amount]" to adjust. Say "lock budget" to pause all spending instantly. She alerts Lee at 80% of any budget limit and cannot exceed limits without approval.',
  'clara_modes',
  true,
  'active'
)
ON CONFLICT DO NOTHING;
