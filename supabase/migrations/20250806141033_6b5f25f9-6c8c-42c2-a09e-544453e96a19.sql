-- Fix the security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.communication_metrics_summary;

CREATE VIEW public.communication_metrics_summary AS
SELECT 
  date,
  channel,
  SUM(CASE WHEN metric_type = 'conversations_total' THEN metric_value ELSE 0 END) as total_conversations,
  SUM(CASE WHEN metric_type = 'messages_sent' THEN metric_value ELSE 0 END) as total_messages,
  AVG(CASE WHEN metric_type = 'response_time_avg' THEN metric_value ELSE NULL END) as avg_response_time,
  AVG(CASE WHEN metric_type = 'resolution_time_avg' THEN metric_value ELSE NULL END) as avg_resolution_time
FROM public.communication_analytics
GROUP BY date, channel
ORDER BY date DESC, channel;