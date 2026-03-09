-- Drop the existing view since it lacks proper access controls
DROP VIEW IF EXISTS public.communication_metrics_summary;

-- Create a security definer function that returns communication metrics summary
CREATE OR REPLACE FUNCTION public.get_communication_metrics_summary()
RETURNS TABLE (
    date date,
    channel text,
    total_conversations bigint,
    total_messages bigint,
    avg_response_time numeric,
    avg_resolution_time numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT date(uc.created_at) AS date,
           uc.channel::text AS channel,
           count(DISTINCT uc.id) AS total_conversations,
           count(*) AS total_messages,
           avg(EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60.0) AS avg_response_time,
           avg(EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60.0) AS avg_resolution_time
    FROM public.unified_conversations uc
    GROUP BY date(uc.created_at), uc.channel;
END;
$$;
