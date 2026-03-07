-- Fix function search_path security issue
-- Apply SET search_path = '' to all database functions
ALTER FUNCTION public.get_user_role() SET search_path = '';
ALTER FUNCTION public.check_admin_setup_allowed() SET search_path = '';
ALTER FUNCTION public.get_communication_metrics_summary() SET search_path = '';
ALTER FUNCTION public.assign_admin_role(uuid) SET search_path = '';
ALTER FUNCTION public.log_security_event(uuid, text, jsonb) SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.track_gmail_token_refresh() SET search_path = '';
ALTER FUNCTION public.get_video_analytics_summary() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.handle_new_user_communication_preferences() SET search_path = '';