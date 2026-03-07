-- Create onboarding progress table
CREATE TABLE public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  steps JSONB NOT NULL DEFAULT '{
    "complete_profile": false,
    "add_emergency_contacts": false,
    "configure_sos_settings": false,
    "invite_family": false,
    "enable_notifications": false,
    "run_sos_test": false
  }'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own onboarding progress"
ON public.onboarding_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own onboarding progress"
ON public.onboarding_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own onboarding progress"
ON public.onboarding_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();