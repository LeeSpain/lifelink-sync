-- Security hardening migration
-- 1) Ensure RLS is enabled on sensitive tables (idempotent)
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.family_invites') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) Lock down read access to admin-only for contact_submissions and leads (if a more permissive policy existed before)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admin can read contact submissions"
    ON public.contact_submissions
    FOR SELECT
    USING (public.is_admin());
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Admin can read leads"
    ON public.leads
    FOR SELECT
    USING (public.is_admin());
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 3) Owner-only access for user-owned sensitive tables (idempotent safety nets)
DO $$
BEGIN
  -- phone_verifications: owner-only all access
  BEGIN
    CREATE POLICY "Users manage own phone verifications (select)"
    ON public.phone_verifications
    FOR SELECT
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own phone verifications (insert)"
    ON public.phone_verifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own phone verifications (update)"
    ON public.phone_verifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own phone verifications (delete)"
    ON public.phone_verifications
    FOR DELETE
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- gmail_tokens: owner-only all access
  BEGIN
    CREATE POLICY "Users manage own gmail tokens (select)"
    ON public.gmail_tokens
    FOR SELECT
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own gmail tokens (insert)"
    ON public.gmail_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own gmail tokens (update)"
    ON public.gmail_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own gmail tokens (delete)"
    ON public.gmail_tokens
    FOR DELETE
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- communication_preferences: owner-only all access
  BEGIN
    CREATE POLICY "Users manage own communication preferences (select)"
    ON public.communication_preferences
    FOR SELECT
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own communication preferences (insert)"
    ON public.communication_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own communication preferences (update)"
    ON public.communication_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Users manage own communication preferences (delete)"
    ON public.communication_preferences
    FOR DELETE
    USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 4) Family invites hardening: enable RLS and restrict access if table exists
DO $$
BEGIN
  IF to_regclass('public.family_invites') IS NOT NULL THEN
    -- Ensure RLS is on (already above) and add restrictive policies (only inviter/invitee can access)
    BEGIN
      CREATE POLICY "Family invites: inviter or invitee can select"
      ON public.family_invites
      FOR SELECT
      USING (
        (COALESCE(inviter_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
        OR (COALESCE(invitee_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
      );
    EXCEPTION WHEN undefined_column THEN
      -- If columns don't exist, fall back to blocking by default via RLS (no policy)
      NULL;
    WHEN duplicate_object THEN NULL; END;

    BEGIN
      CREATE POLICY "Family invites: inviter can insert"
      ON public.family_invites
      FOR INSERT
      WITH CHECK (
        COALESCE(inviter_user_id, auth.uid()) = auth.uid()
      );
    EXCEPTION WHEN undefined_column THEN NULL; WHEN duplicate_object THEN NULL; END;

    BEGIN
      CREATE POLICY "Family invites: inviter or invitee can update"
      ON public.family_invites
      FOR UPDATE
      USING (
        (COALESCE(inviter_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
        OR (COALESCE(invitee_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
      )
      WITH CHECK (
        (COALESCE(inviter_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
        OR (COALESCE(invitee_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
      );
    EXCEPTION WHEN undefined_column THEN NULL; WHEN duplicate_object THEN NULL; END;

    BEGIN
      CREATE POLICY "Family invites: inviter can delete"
      ON public.family_invites
      FOR DELETE
      USING (
        COALESCE(inviter_user_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid()
      );
    EXCEPTION WHEN undefined_column THEN NULL; WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;