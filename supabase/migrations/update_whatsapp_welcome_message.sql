-- Update WhatsApp welcome message
UPDATE whatsapp_settings 
SET setting_value = 'Hi! I''m CLARA from LifeLink Sync, here to help protect you and the people you love. Who are you looking to protect today?'
WHERE setting_key = 'welcome_message';