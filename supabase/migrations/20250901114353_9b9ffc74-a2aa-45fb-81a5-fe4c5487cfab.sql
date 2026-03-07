-- Fix critical RLS security vulnerabilities for existing tables

-- 1. Fix contact_submissions (remove public read access)
DROP POLICY IF EXISTS "Anyone can view contact submissions" ON public.contact_submissions;

-- 2. Fix video_analytics (restrict public insert)  
DROP POLICY IF EXISTS "Anyone can insert video analytics" ON public.video_analytics;
DROP POLICY IF EXISTS "Authenticated users can insert video analytics" ON public.video_analytics;

CREATE POLICY "Authenticated users can insert video analytics" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. Create and secure phone_verifications table if not exists
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies on phone_verifications
DROP POLICY IF EXISTS "Users can access phone verifications" ON public.phone_verifications;

CREATE POLICY "Users can manage their own phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Create and secure registration_selections table
CREATE TABLE IF NOT EXISTS public.registration_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  selected_products JSONB DEFAULT '[]',
  total_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own registration selections" 
ON public.registration_selections 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registration selections" 
ON public.registration_selections 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- 5. Secure leads table - ensure only admin/sales access
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- 6. Fix communication_metrics_summary access  
-- This is a view/table that should only be accessible to admins
-- First check if it's a table or view
DO $$
BEGIN
  -- Try to add RLS to communication_metrics_summary if it's a table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'communication_metrics_summary') THEN
    EXECUTE 'ALTER TABLE public.communication_metrics_summary ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Public can view metrics" ON public.communication_metrics_summary';
    EXECUTE 'CREATE POLICY "Admin can view communication metrics" ON public.communication_metrics_summary FOR SELECT USING (is_admin())';
  END IF;
END $$;

-- 7. Add validation triggers for phone verifications to prevent abuse
CREATE OR REPLACE FUNCTION public.validate_phone_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Ensure user owns the phone verification
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot create verification for another user';
  END IF;
  
  -- Limit verification attempts per phone number per hour
  IF (
    SELECT COUNT(*) 
    FROM public.phone_verifications 
    WHERE phone_number = NEW.phone_number 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many verification attempts for this phone number';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the validation trigger
DROP TRIGGER IF EXISTS validate_phone_verification_trigger ON public.phone_verifications;
CREATE TRIGGER validate_phone_verification_trigger
BEFORE INSERT ON public.phone_verifications
FOR EACH ROW
EXECUTE FUNCTION public.validate_phone_verification();