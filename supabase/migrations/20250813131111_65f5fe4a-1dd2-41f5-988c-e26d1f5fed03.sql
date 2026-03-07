-- Drop the existing view since it lacks proper access controls
DROP VIEW IF EXISTS public.communication_metrics_summary;

-- Create a security definer function that returns communication metrics summary
-- This ensures only admins can access the sensitive business metrics
CREATE OR REPLACE FUNCTION public.get_communication_metrics_summary()
RETURNS TABLE (
    date date,
    channel text,
    total_conversations bigint,
    total_messages bigint,
    avg_response_time numeric,
    avg_resolution_time numeric
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Only allow admins to access this sensitive business data
  SELECT 
    CASE WHEN is_admin() THEN
      (SELECT d.date, d.channel, d.total_conversations, d.total_messages, d.avg_response_time, d.avg_resolution_time
       FROM (
         SELECT date(uc.created_at) AS date,
                'email'::text AS channel,
                count(DISTINCT uc.id) AS total_conversations,
                count(*) AS total_messages,
                avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_response_time,
                avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_resolution_time
         FROM unified_conversations uc
         WHERE uc.channel = 'email'::text
         GROUP BY date(uc.created_at)
         
         UNION ALL
         
         SELECT date(uc.created_at) AS date,
                'whatsapp'::text AS channel,
                count(DISTINCT uc.id) AS total_conversations,
                count(*) AS total_messages,
                avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_response_time,
                avg((EXTRACT(epoch FROM (uc.updated_at - uc.created_at)) / 60::numeric)) AS avg_resolution_time
         FROM unified_conversations uc
         WHERE uc.channel = 'whatsapp'::text
         GROUP BY date(uc.created_at)
       ) d)
    ELSE
      (NULL::date, NULL::text, NULL::bigint, NULL::bigint, NULL::numeric, NULL::numeric)
    END
  WHERE is_admin() = true;
$$;