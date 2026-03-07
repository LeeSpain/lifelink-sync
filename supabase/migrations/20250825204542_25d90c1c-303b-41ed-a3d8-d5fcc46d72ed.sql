-- Fix get_user_role function to handle authentication context properly
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(p.role, 'user'::text) 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- Fix is_admin function to use the corrected get_user_role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(public.get_user_role() = 'admin', false);
$$;

-- Test the video analytics summary function to ensure it works with fixed admin check
-- This will be used by the VideoAnalyticsPage component
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
AS $$
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
$$;