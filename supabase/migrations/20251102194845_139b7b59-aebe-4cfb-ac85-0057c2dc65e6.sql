-- Replace Emma with Clara in training_data
UPDATE training_data 
SET question = replace(question, 'Emma', 'Clara') 
WHERE question ILIKE '%Emma%';

UPDATE training_data 
SET answer = replace(answer, 'Emma', 'Clara') 
WHERE answer ILIKE '%Emma%';

-- Update plan names
UPDATE training_data 
SET answer = replace(answer, 'Member Plan', 'Premium Protection') 
WHERE answer ILIKE '%Member Plan%';

UPDATE training_data 
SET answer = replace(answer, 'Family Access', 'Family Connection') 
WHERE answer ILIKE '%Family Access%';

-- Fix incorrect pricing: €4.99 → €9.99
UPDATE training_data 
SET answer = regexp_replace(answer, '€\s*4\.99', '€9.99', 'gi') 
WHERE answer ~* '€\s*4\.99';

-- Fix incorrect pricing: €29 → €2.99
UPDATE training_data 
SET answer = regexp_replace(answer, '€\s*29(\.00)?', '€2.99', 'gi') 
WHERE answer ~* '€\s*29(\.00)?';

-- Fix incorrect pricing: €49 → €9.99
UPDATE training_data 
SET answer = regexp_replace(answer, '€\s*49(\.00)?', '€9.99', 'gi') 
WHERE answer ~* '€\s*49(\.00)?';

-- Update category from 'emma' to 'assistant'
UPDATE training_data 
SET category = 'assistant' 
WHERE category = 'emma';

-- Replace Emma with Clara in ai_model_settings
UPDATE ai_model_settings
SET setting_value = replace(setting_value::text, 'You are Emma', 'You are Clara')::jsonb
WHERE setting_key = 'system_prompt_templates' AND setting_value::text ILIKE '%Emma%';

UPDATE ai_model_settings
SET setting_value = replace(setting_value::text, 'Emma', 'Clara')::jsonb
WHERE setting_value::text ILIKE '%Emma%';

-- Replace Emma with Clara in whatsapp_settings
UPDATE whatsapp_settings
SET setting_value = replace(setting_value::text, 'I''m Emma', 'I''m Clara')
WHERE setting_key = 'welcome_message' AND setting_value::text ILIKE '%Emma%';

UPDATE whatsapp_settings
SET setting_value = replace(setting_value::text, 'Emma', 'Clara')
WHERE setting_value::text ILIKE '%Emma%';