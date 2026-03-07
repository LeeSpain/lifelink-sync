-- Fix RLS for whatsapp_messages using conversation ownership and secure homepage_analytics

-- 1) Tighten RLS for public.whatsapp_messages using whatsapp_conversations.user_id
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_messages'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY';

    -- Drop all existing policies to replace with safer ones
    FOR pol IN (
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'whatsapp_messages'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.whatsapp_messages', pol.policyname);
    END LOOP;

    -- Admin full access
    CREATE POLICY "Admin can manage whatsapp_messages"
      ON public.whatsapp_messages
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    -- Users can read messages for conversations they own
    CREATE POLICY "Users can read messages in their conversations"
      ON public.whatsapp_messages
      FOR SELECT
      TO authenticated
      USING (
        public.is_admin() OR (
          conversation_id IN (
            SELECT wc.id FROM public.whatsapp_conversations wc
            WHERE wc.user_id = auth.uid()
          )
        )
      );

    -- Users can insert messages only into their conversations
    CREATE POLICY "Users can insert messages into their conversations"
      ON public.whatsapp_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        public.is_admin() OR (
          conversation_id IN (
            SELECT wc.id FROM public.whatsapp_conversations wc
            WHERE wc.user_id = auth.uid()
          )
        )
      );

    -- Users can update messages only within their conversations (if ever needed)
    CREATE POLICY "Users can update messages in their conversations"
      ON public.whatsapp_messages
      FOR UPDATE
      TO authenticated
      USING (
        public.is_admin() OR (
          conversation_id IN (
            SELECT wc.id FROM public.whatsapp_conversations wc
            WHERE wc.user_id = auth.uid()
          )
        )
      )
      WITH CHECK (
        public.is_admin() OR (
          conversation_id IN (
            SELECT wc.id FROM public.whatsapp_conversations wc
            WHERE wc.user_id = auth.uid()
          )
        )
      );

    -- Users can delete messages only within their conversations
    CREATE POLICY "Users can delete messages in their conversations"
      ON public.whatsapp_messages
      FOR DELETE
      TO authenticated
      USING (
        public.is_admin() OR (
          conversation_id IN (
            SELECT wc.id FROM public.whatsapp_conversations wc
            WHERE wc.user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- 2) Restrict homepage_analytics: admin-only reads, insert allowed (anonymous or authenticated) for event capture
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'homepage_analytics'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.homepage_analytics ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies to avoid permissive ones
    FOR pol IN (
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'homepage_analytics'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.homepage_analytics', pol.policyname);
    END LOOP;

    -- Only admins can select analytics
    CREATE POLICY "Admins can read homepage analytics"
      ON public.homepage_analytics
      FOR SELECT
      TO authenticated
      USING (public.is_admin());

    -- Allow inserts from unauthenticated visitors (anon) for event capture
    CREATE POLICY "Allow anon insert for homepage analytics events"
      ON public.homepage_analytics
      FOR INSERT
      TO anon
      WITH CHECK (true);

    -- Allow inserts from authenticated users as well (e.g. SSR, app users)
    CREATE POLICY "Allow authenticated insert for homepage analytics events"
      ON public.homepage_analytics
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- Only admins may update/delete (if ever needed)
    CREATE POLICY "Admins can update homepage analytics"
      ON public.homepage_analytics
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    CREATE POLICY "Admins can delete homepage analytics"
      ON public.homepage_analytics
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
