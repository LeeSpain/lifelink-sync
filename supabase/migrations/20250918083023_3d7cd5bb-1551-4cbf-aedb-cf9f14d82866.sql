-- Enhance leads table for professional CRM
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'website';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create lead_activities table for communication history
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'note', 'status_change'
  subject TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create lead_tags table for better organization
CREATE TABLE IF NOT EXISTS lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default lead tags
INSERT INTO lead_tags (name, color) VALUES 
('Hot Lead', '#ef4444'),
('Cold Lead', '#6b7280'),
('Qualified', '#10b981'),
('Enterprise', '#8b5cf6'),
('Small Business', '#f59e0b'),
('Follow Up', '#f97316')
ON CONFLICT (name) DO NOTHING;

-- Create lead_files table for document storage
CREATE TABLE IF NOT EXISTS lead_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);

-- Enable RLS on new tables
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_activities
CREATE POLICY "Admin can manage lead activities" ON lead_activities
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- RLS policies for lead_tags
CREATE POLICY "Admin can manage lead tags" ON lead_tags
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view lead tags" ON lead_tags
  FOR SELECT USING (true);

-- RLS policies for lead_files
CREATE POLICY "Admin can manage lead files" ON lead_files
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- Add function to automatically update lead score based on activities
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activity_type = 'email' THEN
    UPDATE leads SET lead_score = LEAST(lead_score + 5, 100) WHERE id = NEW.lead_id;
  ELSIF NEW.activity_type = 'call' THEN
    UPDATE leads SET lead_score = LEAST(lead_score + 10, 100) WHERE id = NEW.lead_id;
  ELSIF NEW.activity_type = 'meeting' THEN
    UPDATE leads SET lead_score = LEAST(lead_score + 15, 100) WHERE id = NEW.lead_id;
  END IF;
  
  -- Update last_contacted_at
  UPDATE leads SET last_contacted_at = now() WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic lead scoring
DROP TRIGGER IF EXISTS trigger_update_lead_score ON lead_activities;
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT ON lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();