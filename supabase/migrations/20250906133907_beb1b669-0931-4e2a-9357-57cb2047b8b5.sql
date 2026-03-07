-- Create workflow_stages table to track detailed progress of content creation
CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  output_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow stages
CREATE POLICY "Admin can manage workflow stages"
ON workflow_stages
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workflow_stages_updated_at_trigger
  BEFORE UPDATE ON workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_stages_updated_at();

-- Add realtime support
ALTER TABLE workflow_stages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_stages;