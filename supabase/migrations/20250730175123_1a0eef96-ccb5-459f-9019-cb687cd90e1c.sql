-- Create family_invites table for managing family memberships
CREATE TABLE public.family_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_email TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  relationship TEXT DEFAULT 'Family Member',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their sent invites" 
ON public.family_invites 
FOR SELECT 
USING (inviter_user_id = auth.uid());

CREATE POLICY "Users can create invites" 
ON public.family_invites 
FOR INSERT 
WITH CHECK (inviter_user_id = auth.uid());

CREATE POLICY "Users can update their sent invites" 
ON public.family_invites 
FOR UPDATE 
USING (inviter_user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_invites_updated_at
BEFORE UPDATE ON public.family_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();