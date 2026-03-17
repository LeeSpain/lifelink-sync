-- ============================================================
-- FIX: ai_model_settings had literal double-quote characters
-- wrapping the URL and anon key values, causing ALL cron jobs
-- to fail silently (invalid URL in net.http_post).
--
-- This migration:
-- 1. Strips the rogue double-quotes from existing values
-- 2. Re-creates all cron jobs with a clean slate
-- ============================================================

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Fix ai_model_settings values ─────────────────────────────
-- Remove wrapping double-quote characters from both values
UPDATE public.ai_model_settings
SET setting_value = TRIM(BOTH '"' FROM setting_value),
    updated_at = now()
WHERE setting_key IN ('supabase_functions_url', 'supabase_anon_key')
  AND setting_value LIKE '"%"';

-- Ensure the URL doesn't have a trailing slash
UPDATE public.ai_model_settings
SET setting_value = RTRIM(setting_value, '/'),
    updated_at = now()
WHERE setting_key = 'supabase_functions_url'
  AND setting_value LIKE '%/';

-- ── Remove ALL existing CLARA cron jobs (clean slate) ────────
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname LIKE 'clara-%'
   OR jobname LIKE 'riven-%'
   OR jobname LIKE 'gift-%';

-- ── Helper: build the HTTP call pattern ──────────────────────
-- All jobs use the same pattern: read URL + key from settings

-- ── 1. Morning Briefing — 07:00 UTC (08:00 CET) daily ───────
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

-- ── 2. Weekly Report — Monday 07:00 UTC (08:00 CET) ─────────
SELECT cron.schedule(
  'clara-weekly-report',
  '0 7 * * 1',
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

-- ── 3. CMO Report — Monday 08:00 UTC (09:00 CET) ────────────
SELECT cron.schedule(
  'clara-cmo-report',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-cmo-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 4. Trial Follow-up — 09:00 UTC (10:00 CET) daily ────────
SELECT cron.schedule(
  'clara-trial-followup',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-trial-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 5. Lead Chase — every 6 hours ────────────────────────────
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

-- ── 6. Stale Cleanup — 01:00 UTC (02:00 CET) daily ──────────
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

-- ── 7. Heartbeat — every 6 hours ─────────────────────────────
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

-- ── 8. Outreach Engine — every 6 hours ───────────────────────
SELECT cron.schedule(
  'clara-outreach-engine',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-outreach-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 9. Email Engine — 08:00 UTC (09:00 CET) daily ───────────
SELECT cron.schedule(
  'clara-email-triggers',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-email-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"action":"run_triggers"}'::jsonb
  );
  $$
);

-- ── 10. Content Engine — Monday 06:00 UTC (07:00 CET) ───────
SELECT cron.schedule(
  'clara-weekly-content',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-content-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"action":"generate_weekly"}'::jsonb
  );
  $$
);

-- ── 11. Riven Command Processor — every 15 min ───────────────
SELECT cron.schedule(
  'clara-riven-processor',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/clara-riven',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{"action":"process_commands"}'::jsonb
  );
  $$
);

-- ── 12. Gift Delivery Check — 08:00 UTC daily ───────────────
SELECT cron.schedule(
  'clara-gift-delivery',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_functions_url' LIMIT 1)
           || '/gift-delivery-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT setting_value::text FROM public.ai_model_settings WHERE setting_key = 'supabase_anon_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── Verification query ───────────────────────────────────────
-- Run after migration to confirm all jobs:
-- SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
-- Expected: 12 active jobs
--
-- Verify settings are clean:
-- SELECT setting_key, setting_value FROM public.ai_model_settings
-- WHERE setting_key IN ('supabase_functions_url', 'supabase_anon_key');
-- Expected: no wrapping double-quotes
