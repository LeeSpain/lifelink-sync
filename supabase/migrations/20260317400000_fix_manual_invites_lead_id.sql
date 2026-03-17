-- Add lead_id column to manual_invites for linking to leads table
ALTER TABLE public.manual_invites ADD COLUMN IF NOT EXISTS lead_id UUID;

-- Add service role insert policy if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can insert invites' AND tablename = 'manual_invites') THEN
    CREATE POLICY "Service can insert invites" ON public.manual_invites FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Index for lead lookups
CREATE INDEX IF NOT EXISTS idx_manual_invites_lead_id ON public.manual_invites(lead_id) WHERE lead_id IS NOT NULL;
