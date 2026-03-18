-- Update CLARA daily Facebook CRON to skip if Riven already posted today
SELECT cron.unschedule('clara-daily-facebook-post');

SELECT cron.schedule(
  'clara-daily-facebook-post',
  '0 8 * * *',
  $$
  DO $$
  BEGIN
    -- Only post if Riven hasn't already posted or scheduled for today
    IF NOT EXISTS (
      SELECT 1 FROM public.marketing_content
      WHERE platform = 'facebook'
      AND status IN ('published', 'scheduled')
      AND DATE(COALESCE(posted_at, scheduled_at)) = CURRENT_DATE
    ) THEN
      PERFORM net.http_post(
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
    END IF;
  END $$;
  $$
);
