-- ============================================================
-- CLARA GOD MODE — Build 5: Contact Memory Layer
-- Three-layer persistent memory for CLARA
-- Every person CLARA talks to is remembered forever
-- ============================================================

-- ── TABLE: clara_contact_memory ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.clara_contact_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact identifiers (at least one required)
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  session_id    UUID,

  -- Who they are
  first_name         TEXT,
  preferred_name     TEXT,
  language           TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'nl')),
  currency           TEXT DEFAULT 'EUR',

  -- Who they are protecting
  protecting         TEXT, -- 'self', 'elderly_parent', 'child', 'employee', 'multiple'
  protecting_detail  TEXT, -- free text e.g. "mum who lives alone in Madrid"

  -- Their core fear / pain point
  pain_point         TEXT, -- e.g. "worried about falls when alone"

  -- Sales journey
  journey_stage      TEXT DEFAULT 'new_lead'
    CHECK (journey_stage IN (
      'new_lead',
      'engaged',
      'trial_started',
      'trial_active',
      'converted',
      'churned',
      'support'
    )),

  plan_interest      TEXT, -- 'individual', 'family_link', 'wellbeing', 'medication', 'clara_complete'
  objections         TEXT[], -- array of objections raised e.g. '{"too expensive","not sure I need it"}'

  -- Conversation outcomes
  last_outcome       TEXT, -- e.g. "said they'd think about it", "started trial"
  last_contact_at    TIMESTAMPTZ,
  total_conversations INTEGER DEFAULT 0,

  -- Hot lead tracking
  peak_interest_score INTEGER DEFAULT 0,
  amber_triggered     BOOLEAN DEFAULT false,
  amber_trigger_word  TEXT,
  escalated_to_lee    BOOLEAN DEFAULT false,
  escalated_at        TIMESTAMPTZ,

  -- CLARA's notes (updated after each conversation)
  clara_notes        TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicates
  CONSTRAINT clara_memory_unique_email UNIQUE (contact_email),
  CONSTRAINT clara_memory_unique_phone UNIQUE (contact_phone)
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_clara_memory_user_id     ON public.clara_contact_memory(user_id);
CREATE INDEX idx_clara_memory_email       ON public.clara_contact_memory(contact_email);
CREATE INDEX idx_clara_memory_phone       ON public.clara_contact_memory(contact_phone);
CREATE INDEX idx_clara_memory_session     ON public.clara_contact_memory(session_id);
CREATE INDEX idx_clara_memory_stage       ON public.clara_contact_memory(journey_stage);
CREATE INDEX idx_clara_memory_score       ON public.clara_contact_memory(peak_interest_score DESC);
CREATE INDEX idx_clara_memory_last_contact ON public.clara_contact_memory(last_contact_at DESC);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.clara_contact_memory ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can access memory
-- Customers never see their own memory record
CREATE POLICY "Admins can manage contact memory"
ON public.clara_contact_memory
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Service role can manage contact memory"
ON public.clara_contact_memory
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE TRIGGER update_clara_contact_memory_updated_at
BEFORE UPDATE ON public.clara_contact_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ── FUNCTION: upsert_clara_memory ────────────────────────────
-- Called by ai-chat after every conversation
-- Updates memory with latest context
CREATE OR REPLACE FUNCTION public.upsert_clara_memory(
  p_session_id    UUID,
  p_user_id       UUID DEFAULT NULL,
  p_email         TEXT DEFAULT NULL,
  p_phone         TEXT DEFAULT NULL,
  p_first_name    TEXT DEFAULT NULL,
  p_language      TEXT DEFAULT 'en',
  p_currency      TEXT DEFAULT 'EUR',
  p_protecting    TEXT DEFAULT NULL,
  p_protecting_detail TEXT DEFAULT NULL,
  p_pain_point    TEXT DEFAULT NULL,
  p_journey_stage TEXT DEFAULT NULL,
  p_plan_interest TEXT DEFAULT NULL,
  p_objection     TEXT DEFAULT NULL,
  p_last_outcome  TEXT DEFAULT NULL,
  p_interest_score INTEGER DEFAULT 0,
  p_amber_triggered BOOLEAN DEFAULT false,
  p_amber_word    TEXT DEFAULT NULL,
  p_clara_notes   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Try to find existing record
  SELECT id INTO v_id
  FROM public.clara_contact_memory
  WHERE
    (p_user_id IS NOT NULL AND user_id = p_user_id)
    OR (p_email IS NOT NULL AND contact_email = p_email)
    OR (p_phone IS NOT NULL AND contact_phone = p_phone)
    OR (session_id = p_session_id)
  LIMIT 1;

  IF v_id IS NULL THEN
    -- Create new memory record
    INSERT INTO public.clara_contact_memory (
      session_id, user_id, contact_email, contact_phone,
      first_name, language, currency,
      protecting, protecting_detail, pain_point,
      journey_stage, plan_interest,
      objections, last_outcome,
      peak_interest_score,
      amber_triggered, amber_trigger_word,
      clara_notes,
      last_contact_at, total_conversations
    ) VALUES (
      p_session_id, p_user_id, p_email, p_phone,
      p_first_name, p_language, p_currency,
      p_protecting, p_protecting_detail, p_pain_point,
      COALESCE(p_journey_stage, 'new_lead'),
      p_plan_interest,
      CASE WHEN p_objection IS NOT NULL
        THEN ARRAY[p_objection] ELSE '{}' END,
      p_last_outcome,
      p_interest_score,
      p_amber_triggered, p_amber_word,
      p_clara_notes,
      now(), 1
    )
    RETURNING id INTO v_id;

  ELSE
    -- Update existing memory record
    UPDATE public.clara_contact_memory SET
      -- Only update non-null values
      user_id          = COALESCE(p_user_id, user_id),
      contact_email    = COALESCE(p_email, contact_email),
      contact_phone    = COALESCE(p_phone, contact_phone),
      first_name       = COALESCE(p_first_name, first_name),
      language         = COALESCE(p_language, language),
      currency         = COALESCE(p_currency, currency),
      protecting       = COALESCE(p_protecting, protecting),
      protecting_detail = COALESCE(p_protecting_detail, protecting_detail),
      pain_point       = COALESCE(p_pain_point, pain_point),
      journey_stage    = COALESCE(p_journey_stage, journey_stage),
      plan_interest    = COALESCE(p_plan_interest, plan_interest),
      -- Append new objection to array if provided
      objections       = CASE
        WHEN p_objection IS NOT NULL
          AND NOT (objections @> ARRAY[p_objection])
        THEN objections || ARRAY[p_objection]
        ELSE objections
      END,
      last_outcome     = COALESCE(p_last_outcome, last_outcome),
      -- Only increase peak score, never decrease
      peak_interest_score = GREATEST(peak_interest_score, p_interest_score),
      amber_triggered  = CASE WHEN p_amber_triggered THEN true ELSE amber_triggered END,
      amber_trigger_word = COALESCE(p_amber_word, amber_trigger_word),
      clara_notes      = COALESCE(p_clara_notes, clara_notes),
      last_contact_at  = now(),
      total_conversations = total_conversations + 1,
      updated_at       = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ── FUNCTION: get_clara_memory ────────────────────────────────
-- Called by ai-chat at the START of every conversation
-- Returns a human-readable memory summary CLARA injects into context
CREATE OR REPLACE FUNCTION public.get_clara_memory(
  p_session_id UUID DEFAULT NULL,
  p_user_id    UUID DEFAULT NULL,
  p_email      TEXT DEFAULT NULL,
  p_phone      TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.clara_contact_memory%ROWTYPE;
  v_summary TEXT := '';
BEGIN
  -- Find the memory record
  SELECT * INTO v_record
  FROM public.clara_contact_memory
  WHERE
    (p_user_id IS NOT NULL AND user_id = p_user_id)
    OR (p_email IS NOT NULL AND contact_email = p_email)
    OR (p_phone IS NOT NULL AND contact_phone = p_phone)
    OR (p_session_id IS NOT NULL AND session_id = p_session_id)
  ORDER BY last_contact_at DESC
  LIMIT 1;

  -- No memory found
  IF v_record.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build human-readable summary for CLARA
  v_summary := 'RETURNING CONTACT — you have spoken before.' || chr(10);

  IF v_record.first_name IS NOT NULL THEN
    v_summary := v_summary || 'Name: ' || v_record.first_name || chr(10);
  END IF;

  IF v_record.protecting IS NOT NULL THEN
    v_summary := v_summary || 'Protecting: ' || v_record.protecting;
    IF v_record.protecting_detail IS NOT NULL THEN
      v_summary := v_summary || ' (' || v_record.protecting_detail || ')';
    END IF;
    v_summary := v_summary || chr(10);
  END IF;

  IF v_record.pain_point IS NOT NULL THEN
    v_summary := v_summary || 'Their concern: ' || v_record.pain_point || chr(10);
  END IF;

  v_summary := v_summary || 'Journey stage: ' || v_record.journey_stage || chr(10);

  IF v_record.plan_interest IS NOT NULL THEN
    v_summary := v_summary || 'Interested in: ' || v_record.plan_interest || chr(10);
  END IF;

  IF array_length(v_record.objections, 1) > 0 THEN
    v_summary := v_summary || 'Previous objections: '
      || array_to_string(v_record.objections, ', ') || chr(10);
  END IF;

  IF v_record.last_outcome IS NOT NULL THEN
    v_summary := v_summary || 'Last time: ' || v_record.last_outcome || chr(10);
  END IF;

  v_summary := v_summary || 'Total conversations: '
    || v_record.total_conversations::TEXT || chr(10);

  IF v_record.clara_notes IS NOT NULL THEN
    v_summary := v_summary || 'Your notes: ' || v_record.clara_notes || chr(10);
  END IF;

  v_summary := v_summary
    || 'Use this context naturally. Do not say "according to my records" — '
    || 'just speak as if you remember them personally.';

  RETURN v_summary;
END;
$$;

-- ── GRANT EXECUTE ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.upsert_clara_memory TO service_role;
GRANT EXECUTE ON FUNCTION public.get_clara_memory TO service_role;

-- ── VERIFICATION ──────────────────────────────────────────────
-- Run after migration to confirm:
-- SELECT COUNT(*) FROM public.clara_contact_memory;
-- Expected: 0 (empty, ready for use)
-- SELECT proname FROM pg_proc WHERE proname IN
--   ('upsert_clara_memory', 'get_clara_memory');
-- Expected: 2 rows
