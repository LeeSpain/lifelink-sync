-- Secure sos_call_attempts table: restrict public access, allow only admins, service role, and incident owners

-- Ensure RLS is enabled
ALTER TABLE public.sos_call_attempts ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive or duplicate policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'sos_call_attempts' 
      AND policyname = 'System can manage call attempts'
  ) THEN
    EXECUTE 'DROP POLICY "System can manage call attempts" ON public.sos_call_attempts';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'sos_call_attempts' 
      AND policyname = 'Admins can manage call attempts'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can manage call attempts" ON public.sos_call_attempts';
  END IF;
END $$;

-- Create strict system policy limited to service_role only
CREATE POLICY "System can manage call attempts"
ON public.sos_call_attempts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Note: Existing policies kept in place (validated):
-- 1) "Admins can manage all call attempts" -> USING is_admin(), WITH CHECK is_admin()
-- 2) User-scoped policies referencing sos_incidents to ensure incident ownership
-- These already restrict SELECT/INSERT/UPDATE to incident owners.
