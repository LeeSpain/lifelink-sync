begin;

-- Enable required extensions (idempotent)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule existing job if present (idempotent)
DO $$
DECLARE
  jid int;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'run-posting-processor-every-minute';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

-- Schedule posting-processor every minute
select cron.schedule(
  'run-posting-processor-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
        url:='https://mqroziggaalltuzoyyao.supabase.co/functions/v1/posting-processor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcm96aWdnYWFsbHR1em95eWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTIwOTIsImV4cCI6MjA2OTQ2ODA5Mn0.B8RH5FtncIduK9XTRNnsMn1PeScam2MFIvqjdOKO6Ds"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

commit;