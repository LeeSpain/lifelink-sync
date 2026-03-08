import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMBEDDING_MODEL = 'text-embedding-3-small';

// ============================================================
// Fallbacks (used when DB tables are empty)
// ============================================================

const FALLBACK_CURRENCY_RATES: Record<string, number> = {
  EUR: 1, USD: 1.09, GBP: 0.85, AUD: 1.63,
};

const FALLBACK_RESTRICTED_PATTERNS = [
  { pattern: '\\badmin\\b', replacement_message: null },
  { pattern: 'backend', replacement_message: null },
  { pattern: 'database', replacement_message: null },
  { pattern: 'server key', replacement_message: null },
  { pattern: 'service role', replacement_message: null },
  { pattern: 'supabase service', replacement_message: null },
  { pattern: 'jwt', replacement_message: null },
  { pattern: 'edge function secret', replacement_message: null },
  { pattern: 'api key', replacement_message: null },
  { pattern: 'infrastructure', replacement_message: null },
];

const DEFAULT_SAFETY_MESSAGE = "I'm here to help with customer information. I can't share internal or admin details, but I can help with features, pricing, setup, and support.";

// ============================================================
// Utility functions
// ============================================================

const convertPrice = (amount: number, from: string, to: string, rates: Record<string, number>): number => {
  if (from === to) return amount;
  return (amount / (rates[from] || 1)) * (rates[to] || 1);
};

const formatCurrency = (amount: number, currency: string, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

// ============================================================
// Data loaders
// ============================================================

async function loadCurrencyRates(): Promise<Record<string, number>> {
  const { data } = await supabase.from('clara_currency_config').select('currency_code, rate_to_eur').eq('is_active', true);
  if (data && data.length > 0) {
    return data.reduce((acc: Record<string, number>, r: any) => { acc[r.currency_code] = Number(r.rate_to_eur); return acc; }, {});
  }
  return FALLBACK_CURRENCY_RATES;
}

async function loadRestrictedPatterns(): Promise<Array<{ regex: RegExp; message: string }>> {
  const { data } = await supabase.from('clara_restricted_patterns').select('pattern, replacement_message').eq('is_active', true);
  const patterns = (data && data.length > 0) ? data : FALLBACK_RESTRICTED_PATTERNS;
  return patterns.map((r: any) => ({ regex: new RegExp(r.pattern, 'i'), message: r.replacement_message || DEFAULT_SAFETY_MESSAGE }));
}

async function buildKnowledgeBase(language: string, currency: string, rates: Record<string, number>): Promise<string> {
  const { data: kbSections } = await supabase.from('clara_knowledge_base').select('section, content').eq('language', language).eq('is_active', true).order('sort_order', { ascending: true });
  const memberPrice = convertPrice(9.99, 'EUR', currency, rates);
  const familyPrice = convertPrice(2.99, 'EUR', currency, rates);
  const locale = language === 'es' ? 'es-ES' : language === 'nl' ? 'nl-NL' : 'en-US';
  const fmtMember = formatCurrency(memberPrice, currency, locale);
  const fmtFamily = formatCurrency(familyPrice, currency, locale);

  if (kbSections && kbSections.length > 0) {
    return kbSections.map((s: any) => s.content.replace(/\{currency\}/g, currency).replace(/\{memberPrice\}/g, fmtMember).replace(/\{familyPrice\}/g, fmtFamily)).join('\n\n');
  }
  return `You are Clara, the friendly customer-facing AI assistant for LifeLink Sync.\n\nSTRICT SAFETY AND PRIVACY GUARDRAILS (must always follow):\n- Never disclose or discuss anything internal, admin-only, backend, infrastructure, or company-confidential.\n- If asked for internal info, politely refuse: "${DEFAULT_SAFETY_MESSAGE}"\n- Focus only on public, customer-friendly information.\n\nPricing (quoted in ${currency}):\n- Member Plan: ${fmtMember}/month\n- Family Access: ${fmtFamily}/month\n\nStyle: Warm, clear, empathetic, and concise.`;
}

// ============================================================
// RAG: Embedding generation (inline, no edge function call)
// ============================================================

async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
        dimensions: 1536,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data[0].embedding;
  } catch {
    return null;
  }
}

// ============================================================
// RAG: Semantic retrieval
// ============================================================

async function retrieveSemanticTrainingData(
  queryEmbedding: number[],
  threshold: number,
  count: number
): Promise<Array<{ question: string; answer: string; category: string; similarity: number }> | null> {
  try {
    const { data, error } = await supabase.rpc('match_training_data', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: count,
      p_audience: 'customer',
    });
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Semantic training data retrieval failed:', err);
    return null;
  }
}

async function retrieveConversationMemory(
  queryEmbedding: number[],
  userId: string,
  threshold: number,
  count: number
): Promise<Array<{ memory_type: string; content: string; similarity: number }> | null> {
  try {
    const { data, error } = await supabase.rpc('match_conversation_memory', {
      query_embedding: JSON.stringify(queryEmbedding),
      p_user_id: userId,
      match_threshold: threshold,
      match_count: count,
    });
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('Conversation memory retrieval failed:', err);
    return null;
  }
}

async function retrieveContactContext(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.rpc('get_contact_ai_context', {
      p_user_id: userId,
      p_contact_email: null,
    });
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  } catch (err) {
    console.error('Contact context retrieval failed:', err);
    return null;
  }
}

// ============================================================
// RAG: Fallback training data loader (current behavior)
// ============================================================

async function loadFallbackTrainingData(): Promise<Array<{ question: string; answer: string; category: string }>> {
  const { data } = await supabase
    .from('training_data')
    .select('question, answer, category')
    .eq('status', 'active')
    .eq('audience', 'customer')
    .order('confidence_score', { ascending: false })
    .limit(50);
  return data || [];
}

// ============================================================
// Post-response: Memory extraction (fire-and-forget)
// ============================================================

async function extractAndStoreMemory(
  userId: string,
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  model: string,
  messageCount: number
) {
  try {
    // Extract user facts from patterns
    const factPatterns = [
      { regex: /my name is (\w+)/i, type: 'user_fact' as const, template: (m: RegExpMatchArray) => `User's name is ${m[1]}` },
      { regex: /i(?:'m| am) interested in (.+?)(?:\.|$)/i, type: 'topic_interest' as const, template: (m: RegExpMatchArray) => `Interested in: ${m[1]}` },
      { regex: /i have (\d+) family members/i, type: 'user_fact' as const, template: (m: RegExpMatchArray) => `Has ${m[1]} family members` },
      { regex: /i(?:'m| am) (?:a |an )?(\w+ (?:carer|caregiver|parent|child|spouse|partner))/i, type: 'user_fact' as const, template: (m: RegExpMatchArray) => `User is a ${m[1]}` },
      { regex: /i live in (.+?)(?:\.|,|$)/i, type: 'user_fact' as const, template: (m: RegExpMatchArray) => `Lives in: ${m[1]}` },
      { regex: /i(?:'m| am) looking for (.+?)(?:\.|$)/i, type: 'topic_interest' as const, template: (m: RegExpMatchArray) => `Looking for: ${m[1]}` },
      { regex: /i prefer (.+?)(?:\.|$)/i, type: 'preference' as const, template: (m: RegExpMatchArray) => `Prefers: ${m[1]}` },
    ];

    for (const { regex, type, template } of factPatterns) {
      const match = userMessage.match(regex);
      if (match) {
        const content = template(match);
        // Check if we already have this fact
        const { data: existing } = await supabase
          .from('clara_conversation_memory')
          .select('id')
          .eq('user_id', userId)
          .eq('memory_type', type)
          .eq('content', content)
          .limit(1);

        if (!existing || existing.length === 0) {
          const embedding = await generateQueryEmbedding(content);
          await supabase.from('clara_conversation_memory').insert({
            user_id: userId,
            session_id: sessionId,
            memory_type: type,
            content,
            embedding: embedding ? JSON.stringify(embedding) : null,
            importance_score: type === 'user_fact' ? 4 : 3,
          });
        }
      }
    }

    // Every 5th message, generate a session summary
    if (messageCount > 0 && messageCount % 5 === 0) {
      // Get last 5 messages for this session
      const { data: recentMsgs } = await supabase
        .from('conversations')
        .select('message_type, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMsgs && recentMsgs.length >= 4) {
        const transcript = recentMsgs.reverse().map(m =>
          `${m.message_type === 'user' ? 'User' : 'Clara'}: ${m.content.slice(0, 200)}`
        ).join('\n');

        // Use GPT to summarize
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'Summarize this conversation excerpt in 2-3 concise sentences. Focus on key topics discussed, user needs, and any decisions made. Do not include greetings or small talk.' },
              { role: 'user', content: transcript },
            ],
            temperature: 0.3,
            max_tokens: 150,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0].message.content;
          const embedding = await generateQueryEmbedding(summary);

          // Get retention days for expiry
          const { data: retentionSetting } = await supabase
            .from('ai_model_settings')
            .select('setting_value')
            .eq('setting_key', 'memory_retention_days')
            .single();
          const retentionDays = Number(retentionSetting?.setting_value) || 90;
          const expiresAt = new Date(Date.now() + retentionDays * 86400000).toISOString();

          await supabase.from('clara_conversation_memory').insert({
            user_id: userId,
            session_id: sessionId,
            memory_type: 'session_summary',
            content: summary,
            embedding: embedding ? JSON.stringify(embedding) : null,
            importance_score: 3,
            expires_at: expiresAt,
          });
        }
      }
    }

    // Enforce max memory per user
    const { data: maxSetting } = await supabase
      .from('ai_model_settings')
      .select('setting_value')
      .eq('setting_key', 'max_memory_per_user')
      .single();
    const maxMemory = Number(maxSetting?.setting_value) || 50;

    const { count: memoryCount } = await supabase
      .from('clara_conversation_memory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (memoryCount && memoryCount > maxMemory) {
      // Delete oldest low-importance items
      const { data: oldItems } = await supabase
        .from('clara_conversation_memory')
        .select('id')
        .eq('user_id', userId)
        .order('importance_score', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(memoryCount - maxMemory);

      if (oldItems) {
        const idsToDelete = oldItems.map(i => i.id);
        await supabase.from('clara_conversation_memory').delete().in('id', idsToDelete);
      }
    }
  } catch (err) {
    console.error('Memory extraction failed (non-blocking):', err);
  }
}

// ============================================================
// Post-response: Learning extraction (fire-and-forget)
// ============================================================

async function extractLearning(
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  wasSanitized: boolean,
  autoApproveThreshold: number
) {
  try {
    // Quality heuristics
    const isQuestion = userMessage.includes('?');
    const isSubstantive = aiResponse.length > 50;
    const notSafetyFallback = !wasSanitized;

    if (!isQuestion || !isSubstantive || !notSafetyFallback) return;

    // Simple confidence scoring
    let confidence = 0.5;
    if (userMessage.length > 20) confidence += 0.1;
    if (aiResponse.length > 100) confidence += 0.1;
    if (aiResponse.length > 200) confidence += 0.1;
    if (!userMessage.toLowerCase().includes('test')) confidence += 0.1;

    // Insert into learning queue
    const status = confidence >= autoApproveThreshold ? 'promoted' : 'pending';

    await supabase.from('clara_learning_queue').insert({
      session_id: sessionId,
      user_message: userMessage,
      ai_response: aiResponse,
      extracted_question: userMessage.trim(),
      extracted_answer: aiResponse.trim(),
      suggested_category: 'general',
      confidence,
      status,
    });

    // If auto-promoted, also insert into training_data
    if (status === 'promoted') {
      const { data: newTraining } = await supabase
        .from('training_data')
        .insert({
          question: userMessage.trim(),
          answer: aiResponse.trim(),
          category: 'general',
          status: 'pending', // Still requires admin to mark 'active'
          audience: 'customer',
          confidence_score: confidence,
        })
        .select('id')
        .single();

      if (newTraining) {
        await supabase.from('clara_learning_queue')
          .update({ promoted_training_id: newTraining.id })
          .eq('session_id', sessionId)
          .eq('user_message', userMessage);
      }
    }
  } catch (err) {
    console.error('Learning extraction failed (non-blocking):', err);
  }
}

// ============================================================
// Request interface
// ============================================================

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  contactEmail?: string;
  context?: string;
  conversation_history?: any[];
  language?: string;
  currency?: string;
}

// ============================================================
// Main handler
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId, contactEmail, context, language = 'en', currency = 'EUR' }: ChatRequest = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const currentSessionId = sessionId || crypto.randomUUID();

    // Load all configuration from DB in parallel
    const [currencyRates, restrictedPatterns, aiSettingsData] = await Promise.all([
      loadCurrencyRates(),
      loadRestrictedPatterns(),
      supabase.from('ai_model_settings').select('setting_key, setting_value'),
    ]);

    // Parse AI settings
    const settings = aiSettingsData.data?.reduce((acc: any, s: any) => { acc[s.setting_key] = s.setting_value; return acc; }, {} as any) || {};

    const temperature = Number(settings.temperature) || 0.7;
    const maxTokens = Number(settings.max_tokens) || 500;
    const model = settings.model || 'gpt-4o-mini';
    const frequencyPenalty = Number(settings.frequency_penalty) || 0;
    const presencePenalty = Number(settings.presence_penalty) || 0;
    const enableLogging = settings.enable_logging !== 'false';
    const rateLimitPerMinute = Number(settings.rate_limit_per_minute) || 60;
    const dailyRequestLimit = Number(settings.daily_request_limit) || 10000;
    const systemPromptMode = settings.system_prompt_mode || 'append';
    const memoryEnabled = settings.memory_enabled !== 'false';
    const learningMode = settings.learning_mode === 'true';
    const semanticThreshold = Number(settings.semantic_match_threshold) || 0.7;
    const semanticCount = Number(settings.semantic_match_count) || 8;
    const autoApproveThreshold = Number(settings.learning_auto_approve_threshold) || 0.85;

    // ============================================================
    // Rate limiting
    // ============================================================
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await supabase
      .from('conversations').select('id', { count: 'exact', head: true })
      .eq('message_type', 'user').gte('created_at', oneMinuteAgo);

    if (recentCount && recentCount >= rateLimitPerMinute) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { count: dailyCount } = await supabase
      .from('conversations').select('id', { count: 'exact', head: true })
      .eq('message_type', 'user').gte('created_at', todayStart.toISOString());

    if (dailyCount && dailyCount >= dailyRequestLimit) {
      return new Response(
        JSON.stringify({ error: 'Daily request limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // Get conversation history
    // ============================================================
    const { data: conversationHistory } = await supabase
      .from('conversations')
      .select('message_type, content, created_at')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    const messageCount = conversationHistory?.length || 0;

    // Store user message
    if (enableLogging) {
      await supabase.from('conversations').insert({
        user_id: userId || null,
        session_id: currentSessionId,
        message_type: 'user',
        content: message,
        metadata: {
          context: context || 'general',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || null,
          language, currency,
          source_page: context?.includes('homepage') ? 'homepage' : context?.includes('registration') ? 'registration' : 'general',
        },
      });
    }

    // ============================================================
    // RAG PIPELINE
    // ============================================================

    // Step 1: Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(message);

    // Step 2: Semantic training data retrieval (or fallback)
    let trainingContent = '';
    let trainingData: any[] = [];

    if (queryEmbedding) {
      const semanticResults = await retrieveSemanticTrainingData(queryEmbedding, semanticThreshold, semanticCount);
      if (semanticResults && semanticResults.length > 0) {
        trainingData = semanticResults;
        trainingContent = '\n\nRELEVANT TRAINING DATA:\n' +
          semanticResults.map(r => `Q: ${r.question}\nA: ${r.answer} (relevance: ${(r.similarity * 100).toFixed(0)}%)`).join('\n\n') +
          '\n\nUse this training data to provide accurate responses when relevant.';
      }
    }

    // Fallback: load all training data if semantic search failed or returned nothing
    if (!trainingContent) {
      const fallbackData = await loadFallbackTrainingData();
      trainingData = fallbackData;
      if (fallbackData.length > 0) {
        trainingContent = '\n\nADDITIONAL TRAINING DATA:\n' +
          fallbackData.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n') +
          '\n\nUse this training data to provide accurate responses when relevant.';
      }
    }

    // Step 3: Conversation memory retrieval
    let memoryContent = '';
    if (memoryEnabled && userId && queryEmbedding) {
      const memories = await retrieveConversationMemory(queryEmbedding, userId, 0.6, 5);

      // Also load recent session summaries
      const { data: recentSummaries } = await supabase
        .from('clara_conversation_memory')
        .select('content, created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'session_summary')
        .order('created_at', { ascending: false })
        .limit(3);

      const allMemories: string[] = [];

      if (memories && memories.length > 0) {
        memories.forEach(m => {
          allMemories.push(`[${m.memory_type}] ${m.content}`);
        });
      }

      if (recentSummaries && recentSummaries.length > 0) {
        recentSummaries.forEach(s => {
          const entry = `[recent session] ${s.content}`;
          if (!allMemories.includes(entry)) {
            allMemories.push(entry);
          }
        });
      }

      // Also load user facts
      const { data: userFacts } = await supabase
        .from('clara_conversation_memory')
        .select('content')
        .eq('user_id', userId)
        .in('memory_type', ['user_fact', 'preference'])
        .order('importance_score', { ascending: false })
        .limit(10);

      if (userFacts && userFacts.length > 0) {
        userFacts.forEach(f => {
          const entry = `[known fact] ${f.content}`;
          if (!allMemories.includes(entry)) {
            allMemories.push(entry);
          }
        });
      }

      if (allMemories.length > 0) {
        memoryContent = '\n\nYOUR MEMORY OF THIS USER:\n' +
          allMemories.join('\n') +
          '\n\nUse this memory to personalize your responses. Reference past conversations naturally.';
      }
    }

    // Step 4: Contact context integration
    let contactContent = '';
    if (userId) {
      const contactContext = await retrieveContactContext(userId);
      if (contactContext) {
        const parts: string[] = [];
        if (contactContext.context_summary) {
          parts.push(`Summary: ${contactContext.context_summary}`);
        }
        if (contactContext.engagement_metrics) {
          const metrics = contactContext.engagement_metrics;
          parts.push(`Engagement: ${metrics.total_interactions || 0} total interactions, lead score: ${metrics.lead_score || 0}`);
        }
        if (contactContext.risk_indicators) {
          const risk = contactContext.risk_indicators;
          if (risk.risk_level && risk.risk_level !== 'low') {
            parts.push(`Risk level: ${risk.risk_level}`);
          }
        }
        if (parts.length > 0) {
          contactContent = '\n\nCUSTOMER CONTEXT:\n' + parts.join('\n') +
            '\n\nUse this context to provide informed, personalized assistance.';
        }
      }
    }

    // ============================================================
    // Assemble system prompt
    // ============================================================
    const knowledgeBase = await buildKnowledgeBase(language, currency, currencyRates);
    let systemPrompt = knowledgeBase + trainingContent + memoryContent + contactContent;

    // Handle custom system prompt
    if (settings.system_prompt && typeof settings.system_prompt === 'string' && settings.system_prompt.trim()) {
      if (systemPromptMode === 'override') {
        systemPrompt = settings.system_prompt;
      } else {
        systemPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${settings.system_prompt}`;
      }
    }

    // Build conversation context
    const conversationContext = conversationHistory?.map(msg => ({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })) || [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message },
    ];

    // ============================================================
    // Call OpenAI
    // ============================================================
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model, messages, temperature,
        max_tokens: maxTokens,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content as string;

    // ============================================================
    // Post-filter restricted patterns
    // ============================================================
    let sanitized = aiResponse;
    let wasSanitized = false;
    for (const { regex, message: replacementMsg } of restrictedPatterns) {
      if (regex.test(sanitized)) {
        sanitized = replacementMsg;
        wasSanitized = true;
        break;
      }
    }

    // ============================================================
    // Store AI response
    // ============================================================
    if (enableLogging) {
      await supabase.from('conversations').insert({
        user_id: userId || null,
        session_id: currentSessionId,
        message_type: 'ai',
        content: sanitized,
      });
    }

    // ============================================================
    // Post-response processing (fire-and-forget)
    // ============================================================

    // Memory extraction
    if (memoryEnabled && userId) {
      extractAndStoreMemory(userId, currentSessionId, message, sanitized, model, messageCount)
        .catch(err => console.error('Memory extraction error:', err));
    }

    // Learning extraction
    if (learningMode) {
      extractLearning(currentSessionId, message, aiResponse, wasSanitized, autoApproveThreshold)
        .catch(err => console.error('Learning extraction error:', err));
    }

    // Lead scoring
    const isShowingInterest = /\b(interested|price|cost|sign up|subscribe|family|emergency|elderly|relative|parent|protection|safety)\b/i.test(message);
    const isAskingQuestions = message.includes('?');

    if (isShowingInterest || isAskingQuestions) {
      const { data: existingLead } = await supabase
        .from('leads').select('*').eq('session_id', currentSessionId).single();

      if (existingLead) {
        await supabase.from('leads').update({
          interest_level: Math.min(existingLead.interest_level + 1, 10),
          updated_at: new Date().toISOString(),
        }).eq('session_id', currentSessionId);
      } else {
        await supabase.from('leads').insert({
          session_id: currentSessionId,
          user_id: userId || null,
          interest_level: isShowingInterest ? 3 : 1,
          metadata: { first_message: message },
        });
      }
    }

    // Response delay
    const responseDelay = Number(settings.response_delay) || 0;
    if (responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, responseDelay * 1000));
    }

    return new Response(
      JSON.stringify({ response: sanitized, sessionId: currentSessionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
