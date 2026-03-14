-- Gift Delivery Cron Job
-- Runs daily at 8am UTC to deliver scheduled gifts
-- Calls the gift-delivery-check edge function

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily gift delivery check at 8am UTC
SELECT cron.schedule(
  'gift-delivery-check',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_functions_url', true) || '/gift-delivery-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"source": "pg_cron"}'::jsonb
  );
  $$
);

-- Also schedule expired gift cleanup — marks gifts past expires_at as expired
-- Runs daily at midnight UTC
SELECT cron.schedule(
  'gift-expiry-cleanup',
  '0 0 * * *',
  $$
  UPDATE gift_subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status IN ('paid', 'delivered')
    AND expires_at < now();
  $$
);
