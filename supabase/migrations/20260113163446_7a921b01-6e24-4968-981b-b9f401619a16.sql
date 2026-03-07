-- Add AI draft reply columns to unified_conversations if not exist
ALTER TABLE public.unified_conversations 
ADD COLUMN IF NOT EXISTS ai_suggested_reply text,
ADD COLUMN IF NOT EXISTS ai_sentiment text,
ADD COLUMN IF NOT EXISTS ai_category text;

-- Add comment for documentation
COMMENT ON COLUMN public.unified_conversations.ai_suggested_reply IS 'AI-drafted reply suggestion for admin review';
COMMENT ON COLUMN public.unified_conversations.ai_sentiment IS 'AI-detected sentiment: positive/neutral/negative/urgent';
COMMENT ON COLUMN public.unified_conversations.ai_category IS 'AI-detected category: inquiry/interest/support/complaint';