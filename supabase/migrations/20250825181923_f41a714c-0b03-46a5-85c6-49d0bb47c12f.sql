-- First check what constraint exists and update it to allow 'trial_signup' status
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add updated check constraint that includes trial_signup
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'trial_signup', 'trial_active', 'trial_expired'));