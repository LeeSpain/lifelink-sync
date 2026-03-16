-- Manual invites table — tracks all invites sent from admin dashboard
CREATE TABLE IF NOT EXISTS public.manual_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_whatsapp TEXT,
  protection_for TEXT,
  personal_message TEXT,
  send_via TEXT NOT NULL DEFAULT 'email',
  message_sent TEXT,
  relationship_tone TEXT DEFAULT 'friendly',
  clara_enhanced BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'sent',
  email_sent BOOLEAN DEFAULT false,
  whatsapp_sent BOOLEAN DEFAULT false,
  email_error TEXT,
  whatsapp_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.manual_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON public.manual_invites
  FOR ALL USING (is_admin());

CREATE INDEX idx_manual_invites_status ON public.manual_invites(status);
CREATE INDEX idx_manual_invites_created ON public.manual_invites(created_at DESC);
