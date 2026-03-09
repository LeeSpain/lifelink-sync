-- Enable Row Level Security on communication_metrics_summary (only if it's a base table, not a view)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'communication_metrics_summary' AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'ALTER TABLE public.communication_metrics_summary ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Admin can view communication metrics summary" ON public.communication_metrics_summary';
    EXECUTE 'CREATE POLICY "Admin can view communication metrics summary" ON public.communication_metrics_summary FOR SELECT USING (is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admin can insert communication metrics summary" ON public.communication_metrics_summary';
    EXECUTE 'CREATE POLICY "Admin can insert communication metrics summary" ON public.communication_metrics_summary FOR INSERT WITH CHECK (is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admin can update communication metrics summary" ON public.communication_metrics_summary';
    EXECUTE 'CREATE POLICY "Admin can update communication metrics summary" ON public.communication_metrics_summary FOR UPDATE USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admin can delete communication metrics summary" ON public.communication_metrics_summary';
    EXECUTE 'CREATE POLICY "Admin can delete communication metrics summary" ON public.communication_metrics_summary FOR DELETE USING (is_admin())';
  END IF;
END $$;
