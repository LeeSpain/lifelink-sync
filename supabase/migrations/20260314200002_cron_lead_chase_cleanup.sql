-- ============================================================
-- CLARA GOD MODE Phase 2 — Cron: Hot Lead Chase + Stale Cleanup
-- ============================================================

-- ── Hot Lead Chase: Every 6 hours ─────────────────────────────
SELECT cron.schedule(
  'clara-lead-chase',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-lead-chase',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── Stale Lead Cleanup: Daily at 01:00 UTC (02:00 CET) ───────
SELECT cron.schedule(
  'clara-stale-cleanup',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-stale-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
