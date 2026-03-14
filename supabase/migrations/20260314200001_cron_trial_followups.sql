-- ============================================================
-- CLARA GOD MODE Phase 2 — Cron: Trial Follow-ups (Day 3/6/7)
-- Three pg_cron jobs calling clara-trial-followup with day param
-- ============================================================

-- ── Trial Day 3 Follow-up: Daily at 09:00 UTC (10:00 CET) ────
SELECT cron.schedule(
  'clara-trial-day3',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-trial-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"day": 3}'::jsonb
  );
  $$
);

-- ── Trial Day 6 Follow-up: Daily at 09:00 UTC (10:00 CET) ────
SELECT cron.schedule(
  'clara-trial-day6',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-trial-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"day": 6}'::jsonb
  );
  $$
);

-- ── Trial Day 7 Expiry Warning: Daily at 08:00 UTC (09:00 CET)
SELECT cron.schedule(
  'clara-trial-day7',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-trial-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"day": 7}'::jsonb
  );
  $$
);

-- ── Verification ──────────────────────────────────────────────
-- SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'clara-trial%' ORDER BY jobname;
-- Expected: 3 rows (clara-trial-day3, clara-trial-day6, clara-trial-day7)
