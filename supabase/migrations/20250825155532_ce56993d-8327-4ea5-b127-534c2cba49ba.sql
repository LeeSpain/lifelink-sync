-- Create video analytics table
CREATE TABLE public.video_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  youtube_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'play', 'pause', 'ended', 'seek', 'click'
  watch_duration_seconds INTEGER DEFAULT 0,
  video_position_seconds INTEGER DEFAULT 0,
  total_video_duration_seconds INTEGER,
  user_location JSONB, -- {country, region, city, lat, lng}
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can view all video analytics" 
ON public.video_analytics 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can insert video analytics" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_video_analytics_video_id ON public.video_analytics(video_id);
CREATE INDEX idx_video_analytics_created_at ON public.video_analytics(created_at);
CREATE INDEX idx_video_analytics_event_type ON public.video_analytics(event_type);
CREATE INDEX idx_video_analytics_user_id ON public.video_analytics(user_id);

-- Create function to get video analytics summary
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
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'country', va.user_location->>'country',
        'count', 1
      )
    ) FILTER (WHERE va.user_location->>'country' IS NOT NULL) as top_countries
  FROM public.video_analytics va
  WHERE is_admin() = true
  GROUP BY va.video_id, va.video_title
  ORDER BY total_views DESC;
$$;