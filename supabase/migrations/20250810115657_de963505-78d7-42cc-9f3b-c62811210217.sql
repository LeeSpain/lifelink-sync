-- Secure RLS for whatsapp_messages and homepage_analytics
-- Using EXECUTE for all policy statements to avoid parse-time column validation

-- 1) Tighten RLS for public.whatsapp_messages
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'whatsapp_messages'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'whatsapp_messages' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY';

    FOR pol IN (
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'whatsapp_messages'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.whatsapp_messages', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Users can select their own WhatsApp messages or admin can select all" ON public.whatsapp_messages FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin())';
    EXECUTE 'CREATE POLICY "Users can insert their own WhatsApp messages or admin" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin())';
    EXECUTE 'CREATE POLICY "Users can update their own WhatsApp messages or admin" ON public.whatsapp_messages FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin())';
    EXECUTE 'CREATE POLICY "Users can delete their own WhatsApp messages or admin" ON public.whatsapp_messages FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin())';
  END IF;
END $$;

-- 2) Restrict homepage_analytics
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'homepage_analytics'
  ) THEN
    EXECUTE 'ALTER TABLE public.homepage_analytics ENABLE ROW LEVEL SECURITY';

    FOR pol IN (
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'homepage_analytics'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.homepage_analytics', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "Admins can read homepage analytics" ON public.homepage_analytics FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "Allow anon insert for homepage analytics events" ON public.homepage_analytics FOR INSERT TO anon WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Allow authenticated insert for homepage analytics events" ON public.homepage_analytics FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Admins can update homepage analytics" ON public.homepage_analytics FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "Admins can delete homepage analytics" ON public.homepage_analytics FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;
