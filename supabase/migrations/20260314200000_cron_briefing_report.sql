-- ============================================================
-- CLARA GOD MODE Phase 2 — Cron: Morning Briefing + Weekly Report
-- pg_cron schedules that call edge functions via pg_net
-- ============================================================

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Morning Briefing: Daily at 07:00 UTC (08:00 CET) ─────────
SELECT cron.schedule(
  'clara-morning-briefing',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── Weekly Report: Monday at 08:00 UTC (09:00 CET) ───────────
SELECT cron.schedule(
  'clara-weekly-report',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── Verification ──────────────────────────────────────────────
-- Run after migration to confirm:
-- SELECT jobid, jobname, schedule FROM cron.job ORDER BY jobname;
-- Expected: 2 rows (clara-morning-briefing, clara-weekly-report)
