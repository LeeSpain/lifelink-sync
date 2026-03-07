-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email logs table
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  campaign_id UUID REFERENCES public.email_campaigns(id),
  email_type TEXT NOT NULL, -- 'welcome', 'marketing', 'support', 'ai_response'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'
  provider_message_id TEXT,
  error_message TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication preferences table
CREATE TABLE public.communication_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT false,
  phone_number TEXT,
  preferred_channel TEXT DEFAULT 'email', -- 'email', 'whatsapp', 'both'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for email campaigns
CREATE POLICY "Admin can manage email campaigns" 
ON public.email_campaigns 
FOR ALL 
USING (true);

-- Create policies for email logs
CREATE POLICY "Admin can view all email logs" 
ON public.email_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update email logs" 
ON public.email_logs 
FOR UPDATE 
USING (true);

-- Create policies for communication preferences
CREATE POLICY "Users can manage their own communication preferences" 
ON public.communication_preferences 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage communication preferences" 
ON public.communication_preferences 
FOR ALL 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_preferences_updated_at
BEFORE UPDATE ON public.communication_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create communication preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_communication_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.communication_preferences (user_id, email_notifications, marketing_emails)
  VALUES (NEW.id, true, true);
  RETURN NEW;
END;
$$;

-- Create trigger for new user communication preferences
CREATE TRIGGER on_auth_user_created_communication_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_communication_preferences();