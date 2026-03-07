-- Update system prompt with correct pricing structure
UPDATE public.ai_model_settings
SET setting_value = REPLACE(
  REPLACE(
    setting_value::text,
    'For just €4.99 per month, customers get 24/7 emergency response',
    'We offer two plans: **Family Connection** at €2.99/month for essential safety, or **Premium Protection** at €9.99/month with 24/7 emergency response'
  ),
  'Premium Protection plan',
  'Premium Protection plan (€9.99/month)'
)::jsonb
WHERE setting_key = 'system_prompt';

-- Also update any other references to incorrect pricing in settings
UPDATE public.ai_model_settings
SET setting_value = REPLACE(setting_value::text, '€4.99', '€9.99')::jsonb
WHERE setting_key = 'system_prompt' AND setting_value::text LIKE '%€4.99%';