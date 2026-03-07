-- Fix the SECURITY DEFINER view issue by updating the view definition
-- First drop the existing view
DROP VIEW IF EXISTS public.communication_metrics_summary;

-- Recreate the view without SECURITY DEFINER to address the security linter warning
CREATE VIEW public.communication_metrics_summary AS 
SELECT 
  date,
  channel,
  total_conversations,
  total_messages,
  avg_response_time,
  avg_resolution_time
FROM (
  SELECT 
    DATE(created_at) as date,
    'email' as channel,
    COUNT(DISTINCT id) as total_conversations,
    COUNT(*) as total_messages,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_response_time,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_resolution_time
  FROM unified_conversations 
  WHERE channel = 'email'
  GROUP BY DATE(created_at)
  
  UNION ALL
  
  SELECT 
    DATE(created_at) as date,
    'whatsapp' as channel,
    COUNT(DISTINCT id) as total_conversations,
    COUNT(*) as total_messages,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_response_time,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_resolution_time
  FROM unified_conversations 
  WHERE channel = 'whatsapp'
  GROUP BY DATE(created_at)
) metrics;