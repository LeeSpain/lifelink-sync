-- Ensure onboarding_completed column exists on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Set existing admins as onboarding completed
UPDATE public.profiles
SET onboarding_completed = true
WHERE role = 'admin'
AND (onboarding_completed IS NULL OR onboarding_completed = false);
