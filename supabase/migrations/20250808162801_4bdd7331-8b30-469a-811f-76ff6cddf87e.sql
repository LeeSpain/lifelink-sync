
-- 1) Public site content table for homepage preview config
CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Public can read, only admins can modify
CREATE POLICY "Anyone can view site content"
  ON public.site_content
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site content"
  ON public.site_content
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update site content"
  ON public.site_content
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete site content"
  ON public.site_content
  FOR DELETE
  USING (is_admin());

-- Keep updated_at current on updates
DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime changes on this table
ALTER TABLE public.site_content REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;

-- Seed default homepage preview config (safe, non-sensitive)
INSERT INTO public.site_content(key, value)
VALUES ('homepage_app_preview', jsonb_build_object(
  'appName','ICE SOS Lite',
  'tagline','Tap once for immediate help',
  'primaryColor','#ef4444',      -- brand/emergency red
  'sosColor','#22c55e',          -- SOS button color (green like the mock)
  'voiceLabel','Voice OFF',
  'sosLabel','Emergency SOS',
  'sosSubLabel','Tap for immediate help',
  'cards', jsonb_build_array(
    jsonb_build_object('icon','heart', 'title','Health Status', 'status','Normal', 'description','All vitals within normal range'),
    jsonb_build_object('icon','bell', 'title','Reminders', 'status','2 Today', 'description','Morning medication due in 30 min'),
    jsonb_build_object('icon','activity', 'title','Guardian AI', 'status','Active', 'description','"How are you feeling today?"')
  )
))
ON CONFLICT (key) DO NOTHING;
