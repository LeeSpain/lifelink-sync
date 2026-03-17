-- Add language preference columns where missing

-- manual_invites: add preferred_language
ALTER TABLE public.manual_invites
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- profiles: ensure preferred_language exists (may already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Index for language-based queries on leads
CREATE INDEX IF NOT EXISTS idx_leads_language
  ON public.leads(language);
