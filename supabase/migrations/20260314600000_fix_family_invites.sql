-- Fix family_invites schema gap: invitee_user_id referenced in RLS but missing from schema
ALTER TABLE public.family_invites
ADD COLUMN IF NOT EXISTS invitee_user_id UUID
REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_family_invites_invitee
ON public.family_invites(invitee_user_id);
