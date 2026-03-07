-- Create social_media_accounts table for OAuth connections
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_name TEXT,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connection_status TEXT NOT NULL DEFAULT 'connected',
  follower_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own social media accounts"
ON public.social_media_accounts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_social_media_accounts_updated_at
BEFORE UPDATE ON public.social_media_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();