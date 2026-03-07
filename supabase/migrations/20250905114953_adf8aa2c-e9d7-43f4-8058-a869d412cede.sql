-- Fix Security Definer View issue by enabling security_invoker on all app views
-- This ensures views run with the querying user's permissions and respect RLS

-- communication metrics summary (queried from client in admin pages)
ALTER VIEW IF EXISTS public.communication_metrics_summary
  SET (security_invoker = on);

-- organization-users with profiles (helper view for admin backoffice)
ALTER VIEW IF EXISTS public.organization_users_with_profiles
  SET (security_invoker = on);

-- active connection counts view used by functions and (potentially) clients
ALTER VIEW IF EXISTS public.v_owner_active_connection_counts
  SET (security_invoker = on);
