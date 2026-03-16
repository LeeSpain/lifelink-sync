-- ══════════════════════════════════════════════════════════════
-- Priority 6: Sales, Marketing & Ops tables for CLARA modes
-- ══════════════════════════════════════════════════════════════

-- ── Sales pipeline actions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS clara_sales_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type   text NOT NULL,               -- pipeline_review, chase, demo_booked, conversion_report
  action_data   jsonb DEFAULT '{}',
  proposal_text text,
  status        text DEFAULT 'pending',      -- pending, approved, rejected, executed
  result_text   text,
  created_at    timestamptz DEFAULT now(),
  executed_at   timestamptz
);

ALTER TABLE clara_sales_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_sales" ON clara_sales_actions
  FOR ALL USING (auth.role() = 'service_role');

-- ── Campaign log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clara_campaign_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name   text NOT NULL,
  campaign_type   text NOT NULL,             -- whatsapp_blast, newsletter, segment_target, content
  target_segment  text,
  message_template text,
  recipients      integer DEFAULT 0,
  sent            integer DEFAULT 0,
  opened          integer DEFAULT 0,
  converted       integer DEFAULT 0,
  status          text DEFAULT 'draft',      -- draft, approved, sending, sent, cancelled
  created_at      timestamptz DEFAULT now(),
  sent_at         timestamptz
);

ALTER TABLE clara_campaign_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_campaigns" ON clara_campaign_log
  FOR ALL USING (auth.role() = 'service_role');

-- ── Ops log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clara_ops_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,               -- health_check, failed_payment, churn_alert, system_alert
  severity      text DEFAULT 'info',         -- info, warning, critical
  details       jsonb DEFAULT '{}',
  resolved      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  resolved_at   timestamptz
);

ALTER TABLE clara_ops_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_ops" ON clara_ops_log
  FOR ALL USING (auth.role() = 'service_role');

-- ── Indexes for common queries ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_actions_status ON clara_sales_actions(status);
CREATE INDEX IF NOT EXISTS idx_sales_actions_created ON clara_sales_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_log_status ON clara_campaign_log(status);
CREATE INDEX IF NOT EXISTS idx_ops_log_resolved ON clara_ops_log(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_log_severity ON clara_ops_log(severity, created_at DESC);
