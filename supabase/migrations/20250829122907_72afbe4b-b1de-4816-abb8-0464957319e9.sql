-- Fix remaining security issues and create missing tables if needed

-- 1) Check if registration_selections table exists; if not, create it
CREATE TABLE IF NOT EXISTS public.registration_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  selections jsonb NOT NULL DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on registration_selections
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections FORCE ROW LEVEL SECURITY;

-- Create policies for registration_selections
DROP POLICY IF EXISTS "Users can view own registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Users can manage own registration selections" ON public.registration_selections;
DROP POLICY IF EXISTS "Admins can view all registration selections" ON public.registration_selections;

CREATE POLICY "Users can view own registration selections"
ON public.registration_selections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own registration selections"
ON public.registration_selections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all registration selections"
ON public.registration_selections
FOR SELECT
USING (public.is_admin());

-- 2) Create phone_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  verification_code text NOT NULL,
  attempts integer DEFAULT 0,
  verified_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on phone_verifications
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications FORCE ROW LEVEL SECURITY;

-- Secure phone_verifications policies
DROP POLICY IF EXISTS "Service role can read phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can create own phone verifications" ON public.phone_verifications;

CREATE POLICY "Service role can read phone verifications"
ON public.phone_verifications
FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Users can create own phone verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Attach validation trigger if it doesn't exist
DROP TRIGGER IF EXISTS validate_phone_verification_trigger ON public.phone_verifications;
CREATE TRIGGER validate_phone_verification_trigger
  BEFORE INSERT ON public.phone_verifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_phone_verification();