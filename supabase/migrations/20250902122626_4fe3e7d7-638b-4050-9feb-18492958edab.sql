-- Create tables for production monitoring and emergency testing

-- System health checks table
CREATE TABLE public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'unhealthy')),
  database_status TEXT NOT NULL CHECK (database_status IN ('healthy', 'degraded', 'unhealthy')),
  auth_status TEXT NOT NULL CHECK (auth_status IN ('healthy', 'degraded', 'unhealthy')),
  storage_status TEXT NOT NULL CHECK (storage_status IN ('healthy', 'degraded', 'unhealthy')),
  emergency_status TEXT NOT NULL CHECK (emergency_status IN ('healthy', 'degraded', 'unhealthy')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('healthy', 'degraded', 'unhealthy')),
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance metrics table
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metric_type TEXT NOT NULL,
  values JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Error tracking table
CREATE TABLE public.error_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID,
  url TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage metrics table
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emergency service requests table
CREATE TABLE public.emergency_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN ('medical', 'fire', 'police', 'general')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location_data JSONB,
  user_profile JSONB,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'submitted', 'acknowledged', 'failed', 'test_mode')),
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emergency escalation log table
CREATE TABLE public.emergency_escalation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  service_request_id UUID,
  provider_id TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emergency test results table
CREATE TABLE public.emergency_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  test_type TEXT NOT NULL,
  test_scenario TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  duration_ms INTEGER NOT NULL,
  steps_completed INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  performance_metrics JSONB DEFAULT '{}',
  detailed_results JSONB DEFAULT '[]',
  test_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_escalation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_test_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only for monitoring data)
CREATE POLICY "Admins can manage system health checks" ON public.system_health_checks
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can manage performance metrics" ON public.performance_metrics
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can manage error tracking" ON public.error_tracking
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can manage usage metrics" ON public.usage_metrics
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can manage emergency service requests" ON public.emergency_service_requests
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "System can insert emergency service requests" ON public.emergency_service_requests
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage emergency escalation log" ON public.emergency_escalation_log
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "System can insert emergency escalation log" ON public.emergency_escalation_log
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage emergency test results" ON public.emergency_test_results
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_system_health_checks_timestamp ON public.system_health_checks(check_timestamp);
CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(test_timestamp);
CREATE INDEX idx_error_tracking_timestamp ON public.error_tracking(error_timestamp);
CREATE INDEX idx_usage_metrics_date ON public.usage_metrics(date);
CREATE INDEX idx_emergency_requests_event_id ON public.emergency_service_requests(event_id);
CREATE INDEX idx_emergency_requests_status ON public.emergency_service_requests(status);
CREATE INDEX idx_emergency_escalation_event_id ON public.emergency_escalation_log(event_id);
CREATE INDEX idx_emergency_test_results_timestamp ON public.emergency_test_results(test_timestamp);

-- Add updated_at trigger for emergency_service_requests
CREATE TRIGGER update_emergency_service_requests_updated_at
BEFORE UPDATE ON public.emergency_service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();