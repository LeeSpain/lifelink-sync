-- Create OAuth state table for PKCE flow
CREATE TABLE IF NOT EXISTS public.social_media_oauth_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  platform TEXT NOT NULL,
  user_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_oauth_state ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage OAuth state" 
ON public.social_media_oauth_state 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add cleanup function for expired states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.social_media_oauth_state 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;