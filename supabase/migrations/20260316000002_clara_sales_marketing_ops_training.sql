-- ══════════════════════════════════════════════════════════════
-- Training data for Sales, Marketing & Ops modes
-- ══════════════════════════════════════════════════════════════

INSERT INTO training_data (question, answer, category, is_active, status) VALUES
(
  'What can CLARA do in sales mode?',
  'In /sales mode, CLARA manages the full sales pipeline. Commands: "pipeline" for funnel overview, "chase" to follow up stale leads, "demo [name]" to book a demo, "conversion" for conversion reports, "forecast" for revenue projections. All actions require YES/NO approval before executing.',
  'clara_modes',
  true,
  'active'
),
(
  'What can CLARA do in marketing mode?',
  'In /marketing mode, CLARA handles campaigns and content. Commands: "campaign" to create and send WhatsApp blasts, "content [topic]" for marketing copy drafts, "segment" to see audience breakdown, "newsletter" to draft and send email newsletters, "stats" for campaign performance. All sends require YES/NO approval.',
  'clara_modes',
  true,
  'active'
),
(
  'What can CLARA do in ops mode?',
  'In /ops mode, CLARA monitors platform operations. Commands: "health" for system status check, "payments" to check failed payments, "churn" for churn analysis and win-back campaigns, "errors" for error log review, "users" for user metrics. Actions like payment retries and win-back messages require YES/NO approval.',
  'clara_modes',
  true,
  'active'
)
ON CONFLICT DO NOTHING;
