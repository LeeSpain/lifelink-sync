-- ============================================================
-- FIX: cron jobs used setting_value::text which keeps jsonb
-- quotes around the value. Use #>> '{}' to extract clean text.
--
-- Also removes stale/duplicate jobs and recreates all 13 jobs.
-- ============================================================

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Remove ALL existing cron jobs (clean slate) ──────────────
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname LIKE 'clara-%'
   OR jobname LIKE 'riven-%'
   OR jobname LIKE 'gift-%'
   OR jobname LIKE 'proactive-%';

-- ── 1. Morning Briefing — 07:00 UTC (08:00 CET) daily ───────
SELECT cron.schedule(
  'clara-morning-briefing',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 2. Weekly Report — Monday 08:00 UTC (09:00 CET) ─────────
SELECT cron.schedule(
  'clara-weekly-report',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-cmo-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 3. Trial Follow-up — 09:00 UTC (10:00 CET) daily ────────
SELECT cron.schedule(
  'clara-trial-followup',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-trial-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 4. Lead Chase — every 6 hours ────────────────────────────
SELECT cron.schedule(
  'clara-lead-chase',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-lead-chase',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 5. Stale Cleanup — 01:00 UTC (02:00 CET) daily ──────────
SELECT cron.schedule(
  'clara-stale-cleanup',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-stale-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 6. Heartbeat — every 6 hours ─────────────────────────────
SELECT cron.schedule(
  'clara-heartbeat',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-heartbeat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 7. Riven Command Processor — every 15 min ────────────────
SELECT cron.schedule(
  'riven-command-processor',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-riven',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{"action":"process_commands"}'::jsonb
  );
  $$
);

-- ── 8. Outreach Engine — every 6 hours ───────────────────────
SELECT cron.schedule(
  'clara-outreach-engine',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-outreach-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── 9. Content Engine — Monday 06:00 UTC (07:00 CET) ────────
SELECT cron.schedule(
  'clara-weekly-content',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-content-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{"action":"generate_weekly"}'::jsonb
  );
  $$
);

-- ── 10. Email Engine — 08:00 UTC (09:00 CET) daily ──────────
SELECT cron.schedule(
  'clara-email-triggers',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/clara-email-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{"action":"run_triggers"}'::jsonb
  );
  $$
);

-- ── 11. Proactive Invite Sequence — 10:00 UTC daily ─────────
SELECT cron.schedule(
  'proactive-invite-sequence',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/proactive-invite',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{"action":"process_sequence"}'::jsonb
  );
  $$
);

-- ── 12. Gift Delivery Check — 08:00 UTC daily ───────────────
SELECT cron.schedule(
  'gift-delivery-check',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT setting_value #>> '{}'
      FROM public.ai_model_settings
      WHERE setting_key = 'supabase_functions_url'
      LIMIT 1
    ) || '/gift-delivery-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT setting_value #>> '{}'
        FROM public.ai_model_settings
        WHERE setting_key = 'supabase_anon_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ── Verification ─────────────────────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
-- Expected: 12 active jobs
