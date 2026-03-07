-- Create whatsapp_accounts table for WhatsApp Business accounts
CREATE TABLE public.whatsapp_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_account_id TEXT NOT NULL UNIQUE,
  phone_number_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'active', 'suspended'
  webhook_verify_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage whatsapp accounts" 
ON public.whatsapp_accounts 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_accounts_updated_at
BEFORE UPDATE ON public.whatsapp_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create whatsapp_conversations table for WhatsApp message threads
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_account_id UUID REFERENCES public.whatsapp_accounts(id),
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  user_id UUID, -- If linked to registered user
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'blocked'
  is_business_initiated BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage whatsapp conversations" 
ON public.whatsapp_conversations 
FOR ALL 
USING (true);

-- Add indexes
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX idx_whatsapp_conversations_user_id ON public.whatsapp_conversations(user_id);
CREATE INDEX idx_whatsapp_conversations_account ON public.whatsapp_conversations(whatsapp_account_id);

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON public.whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create whatsapp_messages table for individual messages
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id),
  whatsapp_message_id TEXT UNIQUE,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  message_type TEXT NOT NULL, -- 'text', 'image', 'audio', 'video', 'document', 'location'
  content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  error_message TEXT,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_session_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage whatsapp messages" 
ON public.whatsapp_messages 
FOR ALL 
USING (true);

-- Add indexes
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp);
CREATE INDEX idx_whatsapp_messages_wa_id ON public.whatsapp_messages(whatsapp_message_id);

-- Create phone_verifications table for phone number verification
CREATE TABLE public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'sms'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'failed'
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage phone verifications" 
ON public.phone_verifications 
FOR ALL 
USING (true);

-- Add indexes
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone_number);
CREATE INDEX idx_phone_verifications_user ON public.phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_status ON public.phone_verifications(status);

-- Create whatsapp_settings table for configuration
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage whatsapp settings" 
ON public.whatsapp_settings 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at
BEFORE UPDATE ON public.whatsapp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default WhatsApp settings
INSERT INTO public.whatsapp_settings (setting_key, setting_value, description) VALUES 
('ai_auto_reply_enabled', 'true', 'Enable AI auto-reply for WhatsApp messages'),
('business_hours_enabled', 'false', 'Only respond during business hours'),
('business_hours_start', '09:00', 'Business hours start time'),
('business_hours_end', '17:00', 'Business hours end time'),
('welcome_message', 'Hello! 👋 Welcome to ICE SOS. I''m Emma, your AI safety assistant. How can I help you today?', 'Welcome message for new WhatsApp conversations'),
('auto_reply_delay_ms', '2000', 'Delay before AI auto-reply in milliseconds');