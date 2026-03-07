-- Lead Intelligence Audit Trail Table
CREATE TABLE public.lead_intelligence_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('url', 'text')),
  source_value text NOT NULL,
  extracted_count int NOT NULL DEFAULT 0,
  saved_count int NOT NULL DEFAULT 0,
  model text NULL,
  summary text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_intelligence_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and create their own runs
CREATE POLICY "Users can view their own intelligence runs"
ON public.lead_intelligence_runs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intelligence runs"
ON public.lead_intelligence_runs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_lead_intelligence_runs_user_id ON public.lead_intelligence_runs(user_id);
CREATE INDEX idx_lead_intelligence_runs_created_at ON public.lead_intelligence_runs(created_at DESC);