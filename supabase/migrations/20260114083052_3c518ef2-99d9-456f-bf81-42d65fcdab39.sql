-- Add missing index on (status, scheduled_time) for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_social_media_posting_queue_status_scheduled 
ON public.social_media_posting_queue (status, scheduled_time);

-- Update status column default from 'scheduled' to 'queued'
ALTER TABLE public.social_media_posting_queue 
ALTER COLUMN status SET DEFAULT 'queued';