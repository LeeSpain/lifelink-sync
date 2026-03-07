-- Secure sensitive tables with RLS (idempotent) and harden functions' search_path; add anonymization trigger

-- 0) NOTE: Previous attempt failed with existing policy: policy "System can insert video analytics" for table "video_analytics" already exists

-- 1) contact_submissions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='contact_submissions'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Admin can manage contact submissions'
    ) THEN
      CREATE POLICY "Admin can manage contact submissions"
      ON public.contact_submissions
      FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Public can submit contact forms'
    ) THEN
      CREATE POLICY "Public can submit contact forms"
      ON public.contact_submissions
      FOR INSERT
      WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- 2) leads
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='leads'
  ) THEN
    ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='leads' AND policyname='Admin and sales can manage leads'
    ) THEN
      CREATE POLICY "Admin and sales can manage leads"
      ON public.leads
      FOR ALL
      USING (is_admin() OR is_sales())
      WITH CHECK (is_admin() OR is_sales());
    END IF;
  END IF;
END $$;

-- 3) video_analytics
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='video_analytics'
  ) THEN
    ALTER TABLE IF EXISTS public.video_analytics ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='video_analytics' AND policyname='Admin can view video analytics'
    ) THEN
      CREATE POLICY "Admin can view video analytics"
      ON public.video_analytics
      FOR SELECT
      USING (is_admin());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='video_analytics' AND policyname='System can insert video analytics'
    ) THEN
      CREATE POLICY "System can insert video analytics"
      ON public.video_analytics
      FOR INSERT
      WITH CHECK (true);
    END IF;

    -- Add anonymization trigger if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trg_video_analytics_anonymize_ip'
    ) THEN
      CREATE TRIGGER trg_video_analytics_anonymize_ip
      BEFORE INSERT OR UPDATE ON public.video_analytics
      FOR EACH ROW
      EXECUTE FUNCTION public.anonymize_video_analytics_ip();
    END IF;
  END IF;
END $$;

-- 4) registration_selections
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='registration_selections'
  ) THEN
    ALTER TABLE IF EXISTS public.registration_selections ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='registration_selections' AND policyname='Users can view own registration data'
    ) THEN
      CREATE POLICY "Users can view own registration data"
      ON public.registration_selections
      FOR SELECT
      USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='registration_selections' AND policyname='Users can insert own registration data'
    ) THEN
      CREATE POLICY "Users can insert own registration data"
      ON public.registration_selections
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='registration_selections' AND policyname='Users can update own registration data'
    ) THEN
      CREATE POLICY "Users can update own registration data"
      ON public.registration_selections
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='registration_selections' AND policyname='Admin can manage all registration data'
    ) THEN
      CREATE POLICY "Admin can manage all registration data"
      ON public.registration_selections
      FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin());
    END IF;
  END IF;
END $$;

-- 5) Harden functions with explicit search_path
-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- upsert_live_location
CREATE OR REPLACE FUNCTION public.upsert_live_location(
  p_user_id uuid,
  p_family_group_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision DEFAULT NULL::double precision,
  p_speed double precision DEFAULT NULL::double precision,
  p_heading double precision DEFAULT NULL::double precision,
  p_battery_level integer DEFAULT NULL::integer,
  p_status text DEFAULT 'online'::text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO live_locations (
    user_id, family_group_id, latitude, longitude, 
    accuracy, speed, heading, battery_level, status,
    created_at, updated_at
  ) VALUES (
    p_user_id, p_family_group_id, p_latitude, p_longitude,
    p_accuracy, p_speed, p_heading, p_battery_level, p_status,
    now(), now()
  )
  ON CONFLICT (user_id, family_group_id) 
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    speed = EXCLUDED.speed,
    heading = EXCLUDED.heading,
    battery_level = EXCLUDED.battery_level,
    status = EXCLUDED.status,
    updated_at = now();
END;
$$;
