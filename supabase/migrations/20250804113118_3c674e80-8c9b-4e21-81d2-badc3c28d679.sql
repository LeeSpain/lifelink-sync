-- Create conversations table for AI chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to insert their own conversations
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create index for better performance
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);

-- Create leads table for sales tracking
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  interest_level INTEGER DEFAULT 0 CHECK (interest_level >= 0 AND interest_level <= 10),
  recommended_plan TEXT,
  conversation_summary TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'converted', 'lost')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only allow system access for now (can be modified later for admin access)
CREATE POLICY "System can manage leads" 
ON public.leads 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();