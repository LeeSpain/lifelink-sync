-- Add missing reminder tracking columns to trial_tracking
ALTER TABLE public.trial_tracking
  ADD COLUMN IF NOT EXISTS reminder_day3_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_day6_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_day7_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'onboarding',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Allow 'cancelled' status
ALTER TABLE public.trial_tracking DROP CONSTRAINT IF EXISTS trial_tracking_status_check;
ALTER TABLE public.trial_tracking ADD CONSTRAINT trial_tracking_status_check
  CHECK (status IN ('active', 'expired', 'converted', 'cancelled'));
