-- Secure all public views by enforcing security invoker semantics
-- This addresses the linter finding: "Security Definer View"

DO $$
BEGIN
  -- communication_metrics_summary view
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'communication_metrics_summary'
  ) THEN
    EXECUTE 'ALTER VIEW public.communication_metrics_summary SET (security_invoker = on)';
  END IF;

  -- v_owner_active_connection_counts helper view
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'v_owner_active_connection_counts'
  ) THEN
    EXECUTE 'ALTER VIEW public.v_owner_active_connection_counts SET (security_invoker = on)';
  END IF;

  -- organization_users_with_profiles view
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'organization_users_with_profiles'
  ) THEN
    EXECUTE 'ALTER VIEW public.organization_users_with_profiles SET (security_invoker = on)';
  END IF;
END
$$;