-- Remove lead-related alert crons (CLARA handles these autonomously)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'clara-lead-chase') THEN
    PERFORM cron.unschedule('clara-lead-chase');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'clara-heartbeat') THEN
    PERFORM cron.unschedule('clara-heartbeat');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hot-lead-chase') THEN
    PERFORM cron.unschedule('hot-lead-chase');
  END IF;
  RAISE NOTICE 'Lead alert crons removed';
END $$;

-- Evening briefing at 7pm CET (18:00 UTC in winter, 17:00 UTC in summer)
-- Using 18:00 UTC as safe default
SELECT cron.schedule(
  'clara-evening-briefing',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-evening-briefing',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "scheduled"}'::jsonb
  );
  $$
);

-- Health check at 7:45am CET (6:45 UTC) — runs BEFORE morning briefing
SELECT cron.schedule(
  'clara-health-check-daily',
  '45 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-health-check',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "scheduled"}'::jsonb
  );
  $$
);

-- Health check every 2 hours — catches outages between daily checks
SELECT cron.schedule(
  'clara-health-check-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-health-check',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "scheduled"}'::jsonb
  );
  $$
);
