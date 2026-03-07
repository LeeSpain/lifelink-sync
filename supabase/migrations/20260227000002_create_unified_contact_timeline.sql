-- Unified Contact Timeline System
-- Single source of truth for ALL customer interactions across ALL channels
-- Enables perfect AI memory and complete lead-to-customer tracking

-- Main timeline table - aggregates all events
CREATE TABLE IF NOT EXISTS public.contact_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact identification (flexible - can link to user or be standalone)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  contact_name TEXT,

  -- Event metadata
  event_type TEXT NOT NULL CHECK (event_type IN (
    'chat_message',
    'email_sent',
    'email_opened',
    'email_clicked',
    'voice_call',
    'conference_join',
    'sos_incident',
    'lead_captured',
    'lead_score_change',
    'registration_completed',
    'subscription_change',
    'payment_event',
    'profile_update',
    'ai_interaction',
    'custom_event'
  )),
  event_category TEXT NOT NULL CHECK (event_category IN (
    'communication',
    'emergency',
    'sales',
    'support',
    'system'
  )),

  -- Event details
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_data JSONB DEFAULT '{}'::jsonb, -- All the details about the event

  -- Source tracking
  source_type TEXT NOT NULL, -- 'unified_conversations', 'sos_incidents', 'conference_participants', etc.
  source_id UUID, -- ID in the source table

  -- Related entities (for quick lookups)
  related_incident_id UUID REFERENCES public.sos_incidents(id) ON DELETE SET NULL,
  related_conference_id UUID REFERENCES public.emergency_conferences(id) ON DELETE SET NULL,
  related_conversation_id UUID REFERENCES public.unified_conversations(id) ON DELETE SET NULL,

  -- Sentiment & AI analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT ARRAY[]::text[],
  importance_score INTEGER DEFAULT 3 CHECK (importance_score BETWEEN 1 AND 5), -- 1=critical, 5=low

  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Performance optimization
  CONSTRAINT timeline_contact_check CHECK (
    user_id IS NOT NULL OR
    contact_email IS NOT NULL OR
    contact_phone IS NOT NULL
  )
);

-- Contact engagement summary (rolling aggregates)
CREATE TABLE IF NOT EXISTS public.contact_engagement_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,

  -- Engagement metrics
  total_interactions INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  first_interaction_at TIMESTAMPTZ,

  -- Channel breakdown
  email_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,
  voice_count INTEGER DEFAULT 0,
  emergency_count INTEGER DEFAULT 0,

  -- Email engagement
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  email_open_rate NUMERIC,
  email_click_rate NUMERIC,

  -- Lead scoring
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT CHECK (lead_status IN ('cold', 'warm', 'hot', 'customer', 'churned')),

  -- Sentiment tracking
  positive_interactions INTEGER DEFAULT 0,
  negative_interactions INTEGER DEFAULT 0,
  sentiment_trend TEXT CHECK (sentiment_trend IN ('improving', 'declining', 'stable')),

  -- Risk indicators
  risk_level TEXT CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),
  last_emergency_at TIMESTAMPTZ,
  emergency_response_avg_minutes INTEGER,

  -- Update tracking
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT engagement_contact_unique UNIQUE (user_id, contact_email, contact_phone)
);

-- AI context cache (pre-computed summaries for fast AI lookup)
CREATE TABLE IF NOT EXISTS public.ai_contact_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,

  -- Pre-computed context for AI
  full_context TEXT NOT NULL, -- Complete narrative of customer history
  key_facts JSONB DEFAULT '[]'::jsonb, -- Array of key facts AI should know
  recent_events_summary TEXT, -- Last 30 days summary
  relationship_status TEXT, -- "New lead", "Active customer", "At risk", etc.

  -- Preferences & patterns
  preferred_channel TEXT,
  typical_response_time_minutes INTEGER,
  active_times_of_day TEXT[], -- ["morning", "evening"]

  -- Context metadata
  context_generated_at TIMESTAMPTZ DEFAULT now(),
  context_version INTEGER DEFAULT 1,
  last_timeline_event_id UUID REFERENCES public.contact_timeline(id),

  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT ai_context_unique UNIQUE (user_id, contact_email)
);

-- Indexes for blazing fast timeline queries
CREATE INDEX idx_timeline_user_occurred ON public.contact_timeline(user_id, occurred_at DESC);
CREATE INDEX idx_timeline_email_occurred ON public.contact_timeline(contact_email, occurred_at DESC);
CREATE INDEX idx_timeline_phone_occurred ON public.contact_timeline(contact_phone, occurred_at DESC);
CREATE INDEX idx_timeline_event_type ON public.contact_timeline(event_type);
CREATE INDEX idx_timeline_event_category ON public.contact_timeline(event_category);
CREATE INDEX idx_timeline_occurred_at ON public.contact_timeline(occurred_at DESC);
CREATE INDEX idx_timeline_importance ON public.contact_timeline(importance_score);
CREATE INDEX idx_timeline_source ON public.contact_timeline(source_type, source_id);
CREATE INDEX idx_timeline_incident ON public.contact_timeline(related_incident_id) WHERE related_incident_id IS NOT NULL;
CREATE INDEX idx_timeline_conference ON public.contact_timeline(related_conference_id) WHERE related_conference_id IS NOT NULL;
CREATE INDEX idx_timeline_conversation ON public.contact_timeline(related_conversation_id) WHERE related_conversation_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_timeline_user_category_occurred ON public.contact_timeline(user_id, event_category, occurred_at DESC);
CREATE INDEX idx_timeline_email_category_occurred ON public.contact_timeline(contact_email, event_category, occurred_at DESC);

-- Engagement summary indexes
CREATE INDEX idx_engagement_user ON public.contact_engagement_summary(user_id);
CREATE INDEX idx_engagement_email ON public.contact_engagement_summary(contact_email);
CREATE INDEX idx_engagement_lead_score ON public.contact_engagement_summary(lead_score DESC);
CREATE INDEX idx_engagement_risk ON public.contact_engagement_summary(risk_level);
CREATE INDEX idx_engagement_last_interaction ON public.contact_engagement_summary(last_interaction_at DESC);

-- AI context indexes
CREATE INDEX idx_ai_context_user ON public.ai_contact_context(user_id);
CREATE INDEX idx_ai_context_email ON public.ai_contact_context(contact_email);

-- Enable RLS
ALTER TABLE public.contact_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_engagement_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_contact_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timeline
CREATE POLICY "Users can view their own timeline"
ON public.contact_timeline FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all timelines"
ON public.contact_timeline FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Service role can manage timeline"
ON public.contact_timeline FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for engagement summary
CREATE POLICY "Users can view their own engagement"
ON public.contact_engagement_summary FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all engagement"
ON public.contact_engagement_summary FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Service role can manage engagement"
ON public.contact_engagement_summary FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for AI context
CREATE POLICY "Service role can manage AI context"
ON public.ai_contact_context FOR ALL
USING (true)
WITH CHECK (true);

-- Function to update engagement summary when timeline changes
CREATE OR REPLACE FUNCTION update_contact_engagement()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  -- Get contact identifiers
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_email := COALESCE(NEW.contact_email, OLD.contact_email);
  v_phone := COALESCE(NEW.contact_phone, OLD.contact_phone);

  -- Update or insert engagement summary
  INSERT INTO public.contact_engagement_summary (
    user_id,
    contact_email,
    contact_phone,
    total_interactions,
    last_interaction_at,
    first_interaction_at,
    email_count,
    chat_count,
    voice_count,
    emergency_count,
    emails_sent,
    emails_opened,
    emails_clicked,
    positive_interactions,
    negative_interactions,
    updated_at
  )
  SELECT
    user_id,
    contact_email,
    contact_phone,
    COUNT(*) as total_interactions,
    MAX(occurred_at) as last_interaction_at,
    MIN(occurred_at) as first_interaction_at,
    COUNT(*) FILTER (WHERE event_type IN ('email_sent', 'email_opened', 'email_clicked')) as email_count,
    COUNT(*) FILTER (WHERE event_type = 'chat_message') as chat_count,
    COUNT(*) FILTER (WHERE event_type = 'voice_call') as voice_count,
    COUNT(*) FILTER (WHERE event_type = 'sos_incident') as emergency_count,
    COUNT(*) FILTER (WHERE event_type = 'email_sent') as emails_sent,
    COUNT(*) FILTER (WHERE event_type = 'email_opened') as emails_opened,
    COUNT(*) FILTER (WHERE event_type = 'email_clicked') as emails_clicked,
    COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_interactions,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_interactions,
    now() as updated_at
  FROM public.contact_timeline
  WHERE user_id = v_user_id
    OR contact_email = v_email
    OR contact_phone = v_phone
  GROUP BY user_id, contact_email, contact_phone
  ON CONFLICT (user_id, contact_email, contact_phone)
  DO UPDATE SET
    total_interactions = EXCLUDED.total_interactions,
    last_interaction_at = EXCLUDED.last_interaction_at,
    email_count = EXCLUDED.email_count,
    chat_count = EXCLUDED.chat_count,
    voice_count = EXCLUDED.voice_count,
    emergency_count = EXCLUDED.emergency_count,
    emails_sent = EXCLUDED.emails_sent,
    emails_opened = EXCLUDED.emails_opened,
    emails_clicked = EXCLUDED.emails_clicked,
    positive_interactions = EXCLUDED.positive_interactions,
    negative_interactions = EXCLUDED.negative_interactions,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update engagement summary
CREATE TRIGGER trigger_update_engagement
AFTER INSERT OR UPDATE OR DELETE ON public.contact_timeline
FOR EACH ROW EXECUTE FUNCTION update_contact_engagement();

-- Function to get AI-ready context for a contact
CREATE OR REPLACE FUNCTION get_contact_ai_context(
  p_user_id UUID DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  context_summary TEXT,
  recent_events JSONB,
  engagement_metrics JSONB,
  risk_indicators JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    acc.full_context as context_summary,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'event_type', ct.event_type,
        'event_title', ct.event_title,
        'event_description', ct.event_description,
        'occurred_at', ct.occurred_at,
        'importance', ct.importance_score
      ) ORDER BY ct.occurred_at DESC)
      FROM public.contact_timeline ct
      WHERE (ct.user_id = p_user_id OR ct.contact_email = p_contact_email)
        AND ct.occurred_at > now() - interval '30 days'
      LIMIT 20
    ) as recent_events,
    (
      SELECT jsonb_build_object(
        'total_interactions', ces.total_interactions,
        'lead_score', ces.lead_score,
        'email_open_rate', ces.email_open_rate,
        'sentiment_trend', ces.sentiment_trend
      )
      FROM public.contact_engagement_summary ces
      WHERE ces.user_id = p_user_id OR ces.contact_email = p_contact_email
      LIMIT 1
    ) as engagement_metrics,
    (
      SELECT jsonb_build_object(
        'risk_level', ces.risk_level,
        'last_emergency_at', ces.last_emergency_at,
        'emergency_response_avg', ces.emergency_response_avg_minutes
      )
      FROM public.contact_engagement_summary ces
      WHERE ces.user_id = p_user_id OR ces.contact_email = p_contact_email
      LIMIT 1
    ) as risk_indicators
  FROM public.ai_contact_context acc
  WHERE acc.user_id = p_user_id OR acc.contact_email = p_contact_email
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.contact_timeline IS 'Unified timeline of ALL customer interactions across all channels - single source of truth';
COMMENT ON TABLE public.contact_engagement_summary IS 'Pre-computed engagement metrics and lead scoring for fast queries';
COMMENT ON TABLE public.ai_contact_context IS 'AI-optimized context cache for instant Clara/AI memory recall';

COMMENT ON FUNCTION get_contact_ai_context IS 'Returns complete AI-ready context for a contact including history, metrics, and risk indicators';

COMMENT ON COLUMN public.contact_timeline.event_data IS 'Complete event details in JSON - specific to each event_type';
COMMENT ON COLUMN public.contact_timeline.ai_summary IS 'AI-generated summary of this event for quick context';
COMMENT ON COLUMN public.contact_timeline.importance_score IS '1=Critical (emergency), 2=High (sales), 3=Normal, 4=Low, 5=Info';
