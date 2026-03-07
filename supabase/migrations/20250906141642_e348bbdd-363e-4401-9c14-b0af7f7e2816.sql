-- Create content quality tracking table
CREATE TABLE IF NOT EXISTS content_quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_title TEXT NOT NULL,
  platform TEXT,
  quality_score INTEGER NOT NULL,
  seo_score INTEGER,
  readability_score INTEGER,
  engagement_score INTEGER,
  validation_passed BOOLEAN DEFAULT false,
  issues JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quality metrics
ALTER TABLE content_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quality metrics
CREATE POLICY "Admin users can manage quality metrics" 
ON content_quality_metrics 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create automated testing results table
CREATE TABLE IF NOT EXISTS automated_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_suite TEXT NOT NULL,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
  message TEXT,
  duration_ms INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on test results
ALTER TABLE automated_test_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test results
CREATE POLICY "Admin users can manage test results" 
ON automated_test_results 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add quality tracking columns to publishing queue
ALTER TABLE publishing_queue 
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_issues JSONB,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quality_metrics_created_at ON content_quality_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON automated_test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_suite ON automated_test_results(test_suite);