-- Remediate linter issues: add missing RLS policies and set view to security invoker

-- 1) whatsapp_accounts: admin-only access (contains secrets)
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='whatsapp_accounts') THEN
    -- Ensure RLS is enabled
    EXECUTE 'ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies (if any)
    FOR pol IN (
      SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename='whatsapp_accounts'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.whatsapp_accounts', pol.policyname);
    END LOOP;

    -- Admin full control
    CREATE POLICY "Admin can manage whatsapp_accounts"
      ON public.whatsapp_accounts
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 2) whatsapp_conversations: admin manage; users can manage their own
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='whatsapp_conversations') THEN
    -- Ensure RLS is enabled
    EXECUTE 'ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies (if any)
    FOR pol IN (
      SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename='whatsapp_conversations'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.whatsapp_conversations', pol.policyname);
    END LOOP;

    -- Admin full control
    CREATE POLICY "Admin can manage whatsapp_conversations"
      ON public.whatsapp_conversations
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    -- Users can select their own conversations
    CREATE POLICY "Users can view their whatsapp_conversations"
      ON public.whatsapp_conversations
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- Users can insert conversations for themselves
    CREATE POLICY "Users can insert their whatsapp_conversations"
      ON public.whatsapp_conversations
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- Users can update their own conversations
    CREATE POLICY "Users can update their whatsapp_conversations"
      ON public.whatsapp_conversations
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- Users can delete their own conversations
    CREATE POLICY "Users can delete their whatsapp_conversations"
      ON public.whatsapp_conversations
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 3) campaign_recipients: admin-only (contains bulk PII)
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campaign_recipients') THEN
    EXECUTE 'ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY';

    FOR pol IN (
      SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename='campaign_recipients'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaign_recipients', pol.policyname);
    END LOOP;

    CREATE POLICY "Admin can manage campaign_recipients"
      ON public.campaign_recipients
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 4) email_queue: admin-only (internal queue table)
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_queue') THEN
    EXECUTE 'ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY';

    FOR pol IN (
      SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename='email_queue'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_queue', pol.policyname);
    END LOOP;

    CREATE POLICY "Admin can manage email_queue"
      ON public.email_queue
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 5) View hardening: set communication_metrics_summary to security_invoker
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v' AND n.nspname='public' AND c.relname='communication_metrics_summary'
  ) THEN
    EXECUTE 'ALTER VIEW public.communication_metrics_summary SET (security_invoker = on)';
  END IF;
END $$;
