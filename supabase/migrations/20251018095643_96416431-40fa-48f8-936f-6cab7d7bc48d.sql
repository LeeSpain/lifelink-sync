-- Add transfer tracking columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS transferred_to_care BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS care_transfer_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS care_transfer_status TEXT DEFAULT 'not_transferred',
  ADD COLUMN IF NOT EXISTS care_transfer_error TEXT;

-- Create index for efficient transfer queries
CREATE INDEX IF NOT EXISTS idx_profiles_transfer_status 
  ON public.profiles(transferred_to_care, subscription_regional)
  WHERE subscription_regional = true;