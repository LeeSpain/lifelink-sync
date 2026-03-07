-- Update existing stuck campaigns to force retry
UPDATE marketing_campaigns 
SET status = 'completed', 
    completed_at = now(),
    updated_at = now()
WHERE status = 'running' 
  AND created_at < now() - interval '5 minutes';

-- Add error_message column to campaigns if it doesn't exist
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS error_message text;

-- Add completed_at column if it doesn't exist
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;