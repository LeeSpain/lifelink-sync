-- Instant Voice Callback System
-- Sprint 4: Convert leads to customers through instant human connection

-- Callback requests table
CREATE TABLE IF NOT EXISTS public.callback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,

  -- Request details
  callback_reason TEXT, -- 'sales_inquiry', 'emergency_setup', 'support', 'general'
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  preferred_time TEXT, -- 'now', 'within_1_hour', 'specific_time'
  preferred_time_specific TIMESTAMPTZ,

  -- Source tracking
  source_page TEXT, -- URL where callback was requested
  source_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'queued',
    'calling',
    'connected',
    'completed',
    'no_answer',
    'failed',
    'cancelled'
  )),

  -- Assignment
  assigned_to UUID, -- Sales rep assigned to make the call
  assigned_at TIMESTAMPTZ,

  -- Call details
  call_sid TEXT,
  call_initiated_at TIMESTAMPTZ,
  call_answered_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,
  call_duration_seconds INTEGER,
  call_recording_url TEXT,

  -- Response metrics
  time_to_call_seconds INTEGER, -- Time from request to call initiated
  time_to_answer_seconds INTEGER, -- Time from request to customer answered

  -- Outcome
  outcome TEXT, -- 'scheduled_demo', 'interested', 'not_interested', 'callback_later'
  outcome_notes TEXT,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,

  -- Customer context (for sales rep)
  customer_context JSONB DEFAULT '{}'::jsonb, -- Timeline summary, lead score, etc.

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Callback queue (for distributing callbacks to available reps)
CREATE TABLE IF NOT EXISTS public.callback_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  callback_request_id UUID NOT NULL REFERENCES public.callback_requests(id) ON DELETE CASCADE,

  -- Queue position
  priority INTEGER DEFAULT 50, -- Higher = more urgent (0-100)
  queue_position INTEGER,

  -- Assignment tracking
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- SLA tracking
  target_call_time TIMESTAMPTZ NOT NULL, -- When this should be called by
  sla_met BOOLEAN,

  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'assigned', 'claimed', 'completed', 'expired')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales rep availability (who's available to make calls right now)
CREATE TABLE IF NOT EXISTS public.sales_rep_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- The sales rep

  -- Status
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN (
    'online',
    'on_call',
    'busy',
    'break',
    'offline'
  )),

  -- Capacity
  max_concurrent_calls INTEGER DEFAULT 1,
  current_call_count INTEGER DEFAULT 0,

  -- Stats
  total_callbacks_today INTEGER DEFAULT 0,
  successful_callbacks_today INTEGER DEFAULT 0,
  average_response_time_seconds INTEGER,

  -- Shift info
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,

  -- Last activity
  last_status_change TIMESTAMPTZ DEFAULT now(),
  last_callback_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Callback analytics (daily summaries)
CREATE TABLE IF NOT EXISTS public.callback_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,

  -- Volume
  total_requests INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  no_answer INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,

  -- Performance
  average_response_time_seconds INTEGER,
  median_response_time_seconds INTEGER,
  fastest_response_seconds INTEGER,
  slowest_response_seconds INTEGER,

  -- SLA compliance
  calls_within_60_seconds INTEGER DEFAULT 0,
  calls_within_5_minutes INTEGER DEFAULT 0,
  sla_compliance_rate NUMERIC,

  -- Conversion
  leads_to_demos INTEGER DEFAULT 0,
  conversion_rate NUMERIC,

  -- Rep performance
  rep_breakdown JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(date)
);

-- Indexes for performance
CREATE INDEX idx_callback_requests_status ON public.callback_requests(status);
CREATE INDEX idx_callback_requests_created ON public.callback_requests(created_at DESC);
CREATE INDEX idx_callback_requests_assigned ON public.callback_requests(assigned_to, status);
CREATE INDEX idx_callback_requests_phone ON public.callback_requests(contact_phone);

CREATE INDEX idx_callback_queue_status ON public.callback_queue(status);
CREATE INDEX idx_callback_queue_priority ON public.callback_queue(priority DESC, created_at);
CREATE INDEX idx_callback_queue_assigned ON public.callback_queue(assigned_to);

CREATE INDEX idx_sales_rep_status ON public.sales_rep_availability(status);
CREATE INDEX idx_sales_rep_user ON public.sales_rep_availability(user_id);

CREATE INDEX idx_callback_analytics_date ON public.callback_analytics(date DESC);

-- Enable RLS
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_rep_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Callback requests
CREATE POLICY "Users can view their own callback requests"
ON public.callback_requests FOR SELECT
USING (user_id = auth.uid() OR contact_email = auth.email());

CREATE POLICY "Sales reps can view assigned callbacks"
ON public.callback_requests FOR SELECT
USING (assigned_to = auth.uid() OR EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND raw_user_meta_data->>'role' IN ('admin', 'sales_rep')
));

CREATE POLICY "Service role can manage callback requests"
ON public.callback_requests FOR ALL
USING (true)
WITH CHECK (true);

-- Queue
CREATE POLICY "Sales reps can view queue"
ON public.callback_queue FOR SELECT
USING (EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND raw_user_meta_data->>'role' IN ('admin', 'sales_rep')
));

CREATE POLICY "Service role can manage queue"
ON public.callback_queue FOR ALL
USING (true)
WITH CHECK (true);

-- Availability
CREATE POLICY "Reps can manage their own availability"
ON public.sales_rep_availability FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all availability"
ON public.sales_rep_availability FOR SELECT
USING (EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND raw_user_meta_data->>'role' = 'admin'
));

-- Analytics
CREATE POLICY "Admins and sales reps can view analytics"
ON public.callback_analytics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND raw_user_meta_data->>'role' IN ('admin', 'sales_rep')
));

CREATE POLICY "System can insert analytics"
ON public.callback_analytics FOR INSERT
WITH CHECK (true);

-- Triggers

-- Update timestamp trigger
CREATE TRIGGER update_callback_requests_timestamp
BEFORE UPDATE ON public.callback_requests
FOR EACH ROW EXECUTE FUNCTION update_conference_timestamp();

CREATE TRIGGER update_callback_queue_timestamp
BEFORE UPDATE ON public.callback_queue
FOR EACH ROW EXECUTE FUNCTION update_conference_timestamp();

CREATE TRIGGER update_sales_rep_availability_timestamp
BEFORE UPDATE ON public.sales_rep_availability
FOR EACH ROW EXECUTE FUNCTION update_conference_timestamp();

-- Auto-calculate response time on call initiation
CREATE OR REPLACE FUNCTION calculate_callback_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.call_initiated_at IS NOT NULL AND OLD.call_initiated_at IS NULL THEN
    NEW.time_to_call_seconds := EXTRACT(EPOCH FROM (NEW.call_initiated_at - NEW.created_at))::INTEGER;
  END IF;

  IF NEW.call_answered_at IS NOT NULL AND OLD.call_answered_at IS NULL THEN
    NEW.time_to_answer_seconds := EXTRACT(EPOCH FROM (NEW.call_answered_at - NEW.created_at))::INTEGER;
  END IF;

  IF NEW.call_ended_at IS NOT NULL AND NEW.call_answered_at IS NOT NULL THEN
    NEW.call_duration_seconds := EXTRACT(EPOCH FROM (NEW.call_ended_at - NEW.call_answered_at))::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_response_time
BEFORE UPDATE ON public.callback_requests
FOR EACH ROW EXECUTE FUNCTION calculate_callback_response_time();

-- Function to get next callback from queue
CREATE OR REPLACE FUNCTION get_next_callback_for_rep(p_rep_id UUID)
RETURNS TABLE (
  callback_id UUID,
  request_id UUID,
  contact_name TEXT,
  contact_phone TEXT,
  callback_reason TEXT,
  priority INTEGER,
  customer_context JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cq.id as callback_id,
    cr.id as request_id,
    cr.contact_name,
    cr.contact_phone,
    cr.callback_reason,
    cq.priority,
    cr.customer_context
  FROM public.callback_queue cq
  JOIN public.callback_requests cr ON cq.callback_request_id = cr.id
  WHERE cq.status = 'queued'
    AND cr.status = 'pending'
    AND (cq.assigned_to IS NULL OR cq.assigned_to = p_rep_id)
  ORDER BY cq.priority DESC, cq.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily analytics
CREATE OR REPLACE FUNCTION calculate_callback_analytics(p_date DATE)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_avg_response INTEGER;
BEGIN
  -- Count totals
  SELECT COUNT(*) INTO v_total
  FROM callback_requests
  WHERE created_at::DATE = p_date;

  SELECT COUNT(*) INTO v_completed
  FROM callback_requests
  WHERE created_at::DATE = p_date
    AND status = 'completed';

  -- Average response time
  SELECT AVG(time_to_call_seconds)::INTEGER INTO v_avg_response
  FROM callback_requests
  WHERE created_at::DATE = p_date
    AND time_to_call_seconds IS NOT NULL;

  -- Insert or update analytics
  INSERT INTO callback_analytics (
    date,
    total_requests,
    completed_calls,
    average_response_time_seconds,
    calls_within_60_seconds
  )
  VALUES (
    p_date,
    v_total,
    v_completed,
    v_avg_response,
    (SELECT COUNT(*) FROM callback_requests
     WHERE created_at::DATE = p_date AND time_to_call_seconds <= 60)
  )
  ON CONFLICT (date) DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    completed_calls = EXCLUDED.completed_calls,
    average_response_time_seconds = EXCLUDED.average_response_time_seconds,
    calls_within_60_seconds = EXCLUDED.calls_within_60_seconds;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.callback_requests IS 'Instant voice callback requests from landing pages';
COMMENT ON TABLE public.callback_queue IS 'Priority queue for distributing callbacks to available sales reps';
COMMENT ON TABLE public.sales_rep_availability IS 'Real-time availability status of sales representatives';
COMMENT ON TABLE public.callback_analytics IS 'Daily performance metrics for callback system';

COMMENT ON FUNCTION get_next_callback_for_rep IS 'Returns the highest-priority callback for a sales rep';
COMMENT ON FUNCTION calculate_callback_analytics IS 'Calculates daily callback performance metrics';
