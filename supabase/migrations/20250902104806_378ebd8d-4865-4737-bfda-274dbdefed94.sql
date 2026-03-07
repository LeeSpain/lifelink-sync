-- Enforce strict RLS on privacy-sensitive analytics table without altering existing policies
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics FORCE ROW LEVEL SECURITY;