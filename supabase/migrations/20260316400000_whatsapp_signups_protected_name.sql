ALTER TABLE public.whatsapp_signups
ADD COLUMN IF NOT EXISTS protected_person_name TEXT;
