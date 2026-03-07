-- Add missing fields to social_media_oauth for real posting support

-- Rename token_expires_at to expires_at for consistency (add alias column)
ALTER TABLE public.social_media_oauth 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Copy existing data from token_expires_at to expires_at
UPDATE public.social_media_oauth 
SET expires_at = token_expires_at 
WHERE expires_at IS NULL AND token_expires_at IS NOT NULL;

-- Add token_type field
ALTER TABLE public.social_media_oauth 
ADD COLUMN IF NOT EXISTS token_type text;

-- Add scope field
ALTER TABLE public.social_media_oauth 
ADD COLUMN IF NOT EXISTS scope text;

-- Add platform_account_id for Facebook Page ID / LinkedIn org id
ALTER TABLE public.social_media_oauth 
ADD COLUMN IF NOT EXISTS platform_account_id text;

-- Add metadata jsonb field
ALTER TABLE public.social_media_oauth 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add index on platform and user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_media_oauth_user_platform 
ON public.social_media_oauth(user_id, platform);