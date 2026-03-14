-- ============================================================
-- CLARA GOD MODE Phase 2 — Cron: Heartbeat (proactive outreach)
-- ============================================================

-- ── Heartbeat: Every 6 hours ──────────────────────────────────
SELECT cron.schedule(
  'clara-heartbeat',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-heartbeat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
