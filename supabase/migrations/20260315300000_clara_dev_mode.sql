CREATE TABLE IF NOT EXISTS public.clara_admin_mode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_phone TEXT NOT NULL UNIQUE,
  current_mode TEXT NOT NULL DEFAULT 'business'
    CHECK (current_mode IN ('business', 'dev')),
  mode_set_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_admin_mode
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
ON public.clara_admin_mode FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
