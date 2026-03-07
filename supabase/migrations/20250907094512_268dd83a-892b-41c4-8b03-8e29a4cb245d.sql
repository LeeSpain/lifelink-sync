-- Set security_invoker on specific known view first (if it exists)
ALTER VIEW IF EXISTS public.v_owner_active_connection_counts SET (security_invoker = on);

-- Then attempt to set security_invoker on all views in the public schema
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v' AND n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = on);', r.schema_name, r.view_name);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping view %.%: %', r.schema_name, r.view_name, SQLERRM;
    END;
  END LOOP;
END
$$;