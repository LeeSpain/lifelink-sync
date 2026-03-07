-- Clean up redundant and insecure policies for phone verifications
-- Drop all existing phone verification policies (they have too many public access points)
DROP POLICY IF EXISTS "Users can insert own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can manage their own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can only access own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can update own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can view own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users manage own phone verifications (delete)" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users manage own phone verifications (insert)" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users manage own phone verifications (select)" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users manage own phone verifications (update)" ON public.phone_verifications;

-- Secure phone verifications: only service role can read, only edge functions can create
-- (Verification codes should NEVER be readable by client-side code)
CREATE POLICY "Service role can manage phone verifications"
ON public.phone_verifications
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Check if video_analytics policies exist before creating
DO $$
BEGIN
  -- Clean up video analytics policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_analytics' AND policyname = 'Admin can view all video analytics') THEN
    DROP POLICY "Admin can view all video analytics" ON public.video_analytics;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_analytics' AND policyname = 'Only admins can view video analytics') THEN
    DROP POLICY "Only admins can view video analytics" ON public.video_analytics;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_analytics' AND policyname = 'Authenticated users can insert video analytics') THEN
    DROP POLICY "Authenticated users can insert video analytics" ON public.video_analytics;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_analytics' AND policyname = 'Users can insert own video analytics') THEN
    DROP POLICY "Users can insert own video analytics" ON public.video_analytics;
  END IF;

  -- Create secure video analytics policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_analytics' AND policyname = 'Admins can view video analytics') THEN
    EXECUTE 'CREATE POLICY "Admins can view video analytics" ON public.video_analytics FOR SELECT USING (public.is_admin())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_analytics' AND policyname = 'Authenticated users can insert video analytics') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert video analytics" ON public.video_analytics FOR INSERT WITH CHECK ((auth.uid() = user_id) OR user_id IS NULL)';
  END IF;
END
$$;