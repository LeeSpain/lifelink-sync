-- Clean up the stuck campaign and add timeout constraint
UPDATE marketing_campaigns 
SET status = 'failed', 
    error_message = 'Campaign timed out - stuck in running state', 
    completed_at = now()
WHERE status = 'running' 
  AND created_at < now() - INTERVAL '10 minutes'
  AND completed_at IS NULL;

-- Add a trigger to automatically timeout stuck campaigns
CREATE OR REPLACE FUNCTION cleanup_stuck_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE marketing_campaigns 
  SET status = 'failed', 
      error_message = 'Campaign timed out after 10 minutes', 
      completed_at = now()
  WHERE status = 'running' 
    AND created_at < now() - INTERVAL '10 minutes'
    AND completed_at IS NULL;
END;
$$;