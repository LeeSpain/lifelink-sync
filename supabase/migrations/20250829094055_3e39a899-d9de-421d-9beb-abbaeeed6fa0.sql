-- Create notifications table for admin notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  read_at TIMESTAMP WITH TIME ZONE NULL,
  action_url TEXT NULL,
  action_label TEXT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage their notifications" 
ON public.admin_notifications 
FOR ALL 
USING (is_admin() AND auth.uid() = user_id)
WITH CHECK (is_admin() AND auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();