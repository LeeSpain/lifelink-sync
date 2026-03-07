-- Fix: Set views to SECURITY INVOKER to avoid definer-privilege escalation
-- This ensures underlying table RLS is evaluated with the querying user, not the view owner.

DO $$
BEGIN
  -- v_owner_active_connection_counts
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'v_owner_active_connection_counts' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'ALTER VIEW public.v_owner_active_connection_counts SET (security_invoker = true)';
  END IF;

  -- unified_conversations (if it exists and is a view)
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'unified_conversations' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'ALTER VIEW public.unified_conversations SET (security_invoker = true)';
  END IF;
END
$$;