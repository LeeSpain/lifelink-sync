-- Fix search_path for the workflow stages function
CREATE OR REPLACE FUNCTION update_workflow_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;