-- Daily CLARA Facebook post at 09:00 Madrid time (08:00 UTC)
SELECT cron.schedule(
  'clara-daily-facebook-post',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/facebook-manager',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'action', 'post',
      'message', 'Good morning from CLARA! LifeLink Sync is here 24/7 to protect you and your family. One tap is all it takes in an emergency. Start your free 7-day trial at lifelink-sync.com #EmergencyProtection #FamilySafety #LifeLinkSync'
    )
  );
  $$
);
