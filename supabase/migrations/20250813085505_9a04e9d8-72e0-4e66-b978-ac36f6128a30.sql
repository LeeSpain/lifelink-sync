-- Fix conversations table security vulnerability
-- Remove the dangerous policy that allows reading conversations with NULL user_id

-- First, drop the existing vulnerable policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Make user_id NOT NULL to prevent security issues (existing NULL values will be handled)
-- First update any existing NULL user_id records to a default system user or remove them
DELETE FROM public.conversations WHERE user_id IS NULL;

-- Now make the column NOT NULL to enforce security
ALTER TABLE public.conversations ALTER COLUMN user_id SET NOT NULL;

-- Create secure RLS policies that only allow authenticated users to access their own conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add an index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- Log this security fix for audit purposes
COMMENT ON TABLE public.conversations IS 'Customer conversations - secured with RLS policies restricting access to conversation owners only';