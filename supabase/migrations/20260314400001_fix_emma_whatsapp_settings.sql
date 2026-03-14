-- Fix Emma welcome message
UPDATE public.whatsapp_settings
SET setting_value = 'Hi! I''m CLARA from LifeLink Sync. I''m here to help protect you and the people you love. Who are you looking to protect today — yourself, an elderly parent, or someone else?'
WHERE setting_key = 'welcome_message';
