-- Create training_data table for AI management
CREATE TABLE public.training_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'disabled')),
  confidence_score NUMERIC DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- Create policies for training data
CREATE POLICY "Admin can manage training data" 
ON public.training_data 
FOR ALL 
USING (is_admin());

-- Create ai_model_settings table for AI configuration
CREATE TABLE public.ai_model_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_model_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for AI model settings
CREATE POLICY "Admin can manage AI model settings" 
ON public.ai_model_settings 
FOR ALL 
USING (is_admin());

-- Insert default AI model settings
INSERT INTO public.ai_model_settings (setting_key, setting_value, description) VALUES
('model_configuration', '{"model": "gpt-4.1-2025-04-14", "temperature": 0.7, "max_tokens": 500, "frequency_penalty": 0, "presence_penalty": 0}', 'Core AI model configuration'),
('response_settings', '{"response_delay": 0.5, "enable_logging": true, "auto_learn": false}', 'Response behavior settings'),
('performance_limits', '{"daily_request_limit": 10000, "rate_limit_per_minute": 60, "context_window": 4096}', 'Performance and rate limiting'),
('system_prompt_templates', '{"default": "You are Emma, the AI customer service agent...", "technical": "You are a technical support agent...", "sales": "You are a sales assistant..."}', 'System prompt templates');

-- Create trigger for updated_at on training_data
CREATE TRIGGER update_training_data_updated_at
BEFORE UPDATE ON public.training_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on ai_model_settings
CREATE TRIGGER update_ai_model_settings_updated_at
BEFORE UPDATE ON public.ai_model_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample training data
INSERT INTO public.training_data (question, answer, category, status) VALUES
('What is ICE SOS Lite?', 'ICE SOS Lite is a personal safety and emergency response app that provides 24/7 monitoring, SOS alerts, family notifications, and GPS tracking.', 'product', 'active'),
('How much does the Basic plan cost?', 'The Basic plan costs €7.99 per month and includes essential safety features like SOS alerts and basic family notifications.', 'pricing', 'active'),
('What features are included in the Premium plan?', 'The Premium plan (€19.99/month) includes all Basic features plus advanced GPS tracking, medical information storage, emergency contact management, and priority response.', 'pricing', 'active'),
('How does the SOS feature work?', 'The SOS feature allows you to send an immediate emergency alert to your designated contacts and emergency services with your exact GPS location by pressing the SOS button or using voice activation.', 'features', 'active'),
('Can family members track my location?', 'Yes, with your permission, family members added to your emergency contacts can see your location during emergencies or when you share your location with them.', 'features', 'pending'),
('What is the Enterprise plan pricing?', 'The Enterprise plan costs €49.99 per month and includes all Premium features plus team management, advanced analytics, and dedicated support for businesses.', 'pricing', 'active'),
('Is my data secure?', 'Yes, all data is encrypted and stored securely with GDPR compliance. We use industry-standard security measures to protect your personal and medical information.', 'security', 'active'),
('How do I add emergency contacts?', 'You can add emergency contacts in the app settings under Family & Contacts section. You can add up to 10 emergency contacts with different priority levels.', 'features', 'active');