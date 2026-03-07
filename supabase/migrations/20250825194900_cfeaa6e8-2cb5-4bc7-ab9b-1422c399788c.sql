-- 1) Harden RLS for whatsapp_settings (remove permissive policy, ensure admin-only)
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policy if it exists
DROP POLICY IF EXISTS "System can manage whatsapp settings" ON public.whatsapp_settings;

-- Ensure admin-only policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Admin can manage whatsapp settings' 
      AND schemaname = 'public' 
      AND tablename = 'whatsapp_settings'
  ) THEN
    CREATE POLICY "Admin can manage whatsapp settings"
    ON public.whatsapp_settings
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- 2) Recreate get_video_analytics_summary with secure search_path
CREATE OR REPLACE FUNCTION public.get_video_analytics_summary()
RETURNS TABLE(
  video_id text,
  video_title text,
  total_views bigint,
  total_watch_time_minutes numeric,
  avg_watch_time_minutes numeric,
  completion_rate numeric,
  unique_viewers bigint,
  top_countries jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT 
    va.video_id,
    va.video_title,
    COUNT(DISTINCT CASE WHEN va.event_type = 'play' THEN va.session_id END) as total_views,
    ROUND(SUM(va.watch_duration_seconds) / 60.0, 2) as total_watch_time_minutes,
    ROUND(AVG(va.watch_duration_seconds) / 60.0, 2) as avg_watch_time_minutes,
    ROUND(
      COUNT(DISTINCT CASE WHEN va.event_type = 'ended' THEN va.session_id END)::numeric / 
      NULLIF(COUNT(DISTINCT CASE WHEN va.event_type = 'play' THEN va.session_id END), 0) * 100, 
      2
    ) as completion_rate,
    COUNT(DISTINCT va.user_id) as unique_viewers,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'country', country,
          'count', country_count
        )
      )
      FROM (
        SELECT 
          va2.user_location->>'country' as country,
          COUNT(*) as country_count
        FROM public.video_analytics va2
        WHERE va2.video_id = va.video_id 
          AND va2.user_location->>'country' IS NOT NULL
          AND va2.event_type = 'play'
        GROUP BY va2.user_location->>'country'
        ORDER BY country_count DESC
        LIMIT 10
      ) country_stats
    ) as top_countries
  FROM public.video_analytics va
  WHERE public.is_admin() = true
  GROUP BY va.video_id, va.video_title
  ORDER BY total_views DESC;
$function$;