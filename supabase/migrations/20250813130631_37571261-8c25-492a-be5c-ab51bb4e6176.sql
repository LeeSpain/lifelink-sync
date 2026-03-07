-- Enable Row Level Security on communication_metrics_summary table
ALTER TABLE public.communication_metrics_summary ENABLE ROW LEVEL SECURITY;

-- Add policy to allow only admins to view communication metrics summary
CREATE POLICY "Admin can view communication metrics summary" 
ON public.communication_metrics_summary 
FOR SELECT 
USING (is_admin());

-- Add policy to allow only admins to insert communication metrics summary (for automated systems)
CREATE POLICY "Admin can insert communication metrics summary" 
ON public.communication_metrics_summary 
FOR INSERT 
WITH CHECK (is_admin());

-- Add policy to allow only admins to update communication metrics summary
CREATE POLICY "Admin can update communication metrics summary" 
ON public.communication_metrics_summary 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Add policy to allow only admins to delete communication metrics summary
CREATE POLICY "Admin can delete communication metrics summary" 
ON public.communication_metrics_summary 
FOR DELETE 
USING (is_admin());