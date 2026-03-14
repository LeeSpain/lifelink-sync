-- Fix Emma welcome message in whatsapp_settings
UPDATE public.whatsapp_settings
SET setting_value = 'Hi! I''m CLARA from LifeLink Sync. I''m here to help protect you and the people you love. Who are you looking to protect today — yourself, an elderly parent, or someone else?'
WHERE setting_key = 'welcome_message';

-- Fix any remaining Emma references in training_data
UPDATE public.training_data
SET status = 'inactive'
WHERE (answer ILIKE '%emma%' OR question ILIKE '%emma%')
AND status = 'active';

-- Fix any remaining ICE SOS references
UPDATE public.training_data
SET status = 'inactive'
WHERE (answer ILIKE '%ice sos%' OR question ILIKE '%ice sos%')
AND status = 'active';
