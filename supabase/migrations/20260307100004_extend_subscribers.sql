-- Extend subscribers table with trial and add-on tracking columns
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS is_trialing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_addons TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS clara_complete_unlocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
