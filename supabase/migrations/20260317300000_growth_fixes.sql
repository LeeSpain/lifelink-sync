-- Growth section fixes: missing columns + performance indexes

-- Leads table: add missing columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Profiles table: referral reward tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_reward_granted TIMESTAMPTZ;

-- Performance indexes for leads queries
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_interest ON public.leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);

-- Performance indexes for referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- Add first_name and last_name columns if missing
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Backfill full_name from first_name + last_name where available
UPDATE public.leads
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL
AND (first_name IS NOT NULL OR last_name IS NOT NULL);
