-- Harden all public views to run with the querying user's permissions (SECURITY INVOKER)
-- This prevents privilege escalation through definer semantics on views and ensures RLS is respected.
-- The migration is idempotent and only targets views in the public schema.

DO $$
DECLARE
  v RECORD;
BEGIN
  FOR v IN 
    SELECT n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
  LOOP
    BEGIN
      EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = on)', v.schema_name, v.view_name);
      RAISE NOTICE 'Set SECURITY INVOKER on view %.%', v.schema_name, v.view_name;
    EXCEPTION WHEN OTHERS THEN
      -- If the server doesn't support security_invoker on this view or any other error occurs, log and continue
      RAISE NOTICE 'Skipped view %.% due to: %', v.schema_name, v.view_name, SQLERRM;
    END;
  END LOOP;
END $$;