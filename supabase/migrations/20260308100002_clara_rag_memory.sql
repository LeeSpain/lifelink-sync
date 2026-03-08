-- Clara RAG Memory System
-- Adds pgvector, embedding columns, conversation memory, learning queue, and semantic search RPCs

-- ============================================================
-- 1. Enable pgvector extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- 2. Add embedding column to existing training_data
-- ============================================================
ALTER TABLE public.training_data
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_training_data_embedding
  ON public.training_data
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- 3. Clara Conversation Memory (long-term, cross-session)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('session_summary', 'user_fact', 'preference', 'topic_interest')),
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  importance_score INTEGER DEFAULT 3 CHECK (importance_score BETWEEN 1 AND 5),
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to clara memory"
  ON public.clara_conversation_memory FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admin can manage clara memory"
  ON public.clara_conversation_memory FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view own memory"
  ON public.clara_conversation_memory FOR SELECT
  USING (user_id = auth.uid());

CREATE INDEX idx_clara_memory_user ON public.clara_conversation_memory (user_id, created_at DESC);
CREATE INDEX idx_clara_memory_type ON public.clara_conversation_memory (memory_type);
CREATE INDEX idx_clara_memory_expires ON public.clara_conversation_memory (expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX idx_clara_memory_embedding
  ON public.clara_conversation_memory
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- 4. Clara Learning Queue (auto-extracted Q&A candidates)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_learning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  extracted_question TEXT,
  extracted_answer TEXT,
  suggested_category TEXT DEFAULT 'general',
  suggested_tags TEXT[] DEFAULT '{}',
  confidence NUMERIC DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'promoted')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  promoted_training_id UUID REFERENCES public.training_data(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_learning_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage learning queue"
  ON public.clara_learning_queue FOR ALL
  USING (is_admin());

CREATE POLICY "Service role full access to learning queue"
  ON public.clara_learning_queue FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_learning_queue_status ON public.clara_learning_queue (status);
CREATE INDEX idx_learning_queue_confidence ON public.clara_learning_queue (confidence DESC);

-- ============================================================
-- 5. Clara Embedding Jobs (batch progress tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('training_data', 'memory', 'knowledge_base')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_embedding_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage embedding jobs"
  ON public.clara_embedding_jobs FOR ALL
  USING (is_admin());

CREATE POLICY "Service role full access to embedding jobs"
  ON public.clara_embedding_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 6. RPC: Semantic search on training_data
-- ============================================================
CREATE OR REPLACE FUNCTION match_training_data(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 8,
  p_audience TEXT DEFAULT 'customer'
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  category TEXT,
  tags TEXT[],
  confidence_score NUMERIC,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.question,
    td.answer,
    td.category,
    td.tags,
    td.confidence_score,
    (1 - (td.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.training_data td
  WHERE td.status = 'active'
    AND td.audience = p_audience
    AND td.embedding IS NOT NULL
    AND (1 - (td.embedding <=> query_embedding)) > match_threshold
  ORDER BY td.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. RPC: Semantic search on conversation memory
-- ============================================================
CREATE OR REPLACE FUNCTION match_conversation_memory(
  query_embedding extensions.vector(1536),
  p_user_id UUID,
  match_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  content TEXT,
  importance_score INTEGER,
  similarity FLOAT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.memory_type,
    m.content,
    m.importance_score,
    (1 - (m.embedding <=> query_embedding))::FLOAT AS similarity,
    m.created_at
  FROM public.clara_conversation_memory m
  WHERE m.user_id = p_user_id
    AND m.embedding IS NOT NULL
    AND (m.expires_at IS NULL OR m.expires_at > now())
    AND (1 - (m.embedding <=> query_embedding)) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. New ai_model_settings keys for RAG configuration
-- ============================================================
INSERT INTO public.ai_model_settings (setting_key, setting_value, description) VALUES
('learning_auto_approve_threshold', '0.85', 'Auto-approve learning items above this confidence'),
('memory_retention_days', '90', 'Days before session summaries expire'),
('max_memory_per_user', '50', 'Maximum memory items per user'),
('semantic_match_threshold', '0.7', 'Minimum cosine similarity for training data retrieval'),
('semantic_match_count', '8', 'Number of training items to retrieve via semantic search')
ON CONFLICT (setting_key) DO NOTHING;
