-- Create table for contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  session_id UUID
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for contact submissions
CREATE POLICY "Admin can manage all contact submissions" 
ON public.contact_submissions 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "System can insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();