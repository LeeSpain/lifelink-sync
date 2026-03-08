import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fallback currency rates (used only if DB table is empty)
const FALLBACK_CURRENCY_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.85,
  AUD: 1.63,
};

// Fallback restricted patterns (used only if DB table is empty)
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

/**
 * Load currency rates from DB, falling back to hardcoded defaults
 */
async function loadCurrencyRates(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('clara_currency_config')
    .select('currency_code, rate_to_eur')
    .eq('is_active', true);

  if (data && data.length > 0) {
    return data.reduce((acc: Record<string, number>, row: any) => {
      acc[row.currency_code] = Number(row.rate_to_eur);
      return acc;
    }, {});
  }
  return FALLBACK_CURRENCY_RATES;
}

/**
 * Load restricted patterns from DB, falling back to hardcoded defaults
 */
async function loadRestrictedPatterns(): Promise<Array<{ regex: RegExp; message: string }>> {
  const { data } = await supabase
    .from('clara_restricted_patterns')
    .select('pattern, replacement_message')
    .eq('is_active', true);

  const patterns = (data && data.length > 0) ? data : FALLBACK_RESTRICTED_PATTERNS;

  return patterns.map((row: any) => ({
    regex: new RegExp(row.pattern, 'i'),
    message: row.replacement_message || DEFAULT_SAFETY_MESSAGE,
  }));
}

/**
 * Build knowledge base from DB, falling back to hardcoded content
 */
async function buildKnowledgeBase(
  language: string,
  currency: string,
  currencyRates: Record<string, number>
): Promise<string> {
  const { data: kbSections } = await supabase
    .from('clara_knowledge_base')
    .select('section, content')
    .eq('language', language)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Format pricing for substitution
  const memberPrice = convertPrice(9.99, 'EUR', currency, currencyRates);
  const familyPrice = convertPrice(2.99, 'EUR', currency, currencyRates);
  const locale = language === 'es' ? 'es-ES' : language === 'nl' ? 'nl-NL' : 'en-US';
  const formattedMember = formatCurrency(memberPrice, currency, locale);
  const formattedFamily = formatCurrency(familyPrice, currency, locale);

  if (kbSections && kbSections.length > 0) {
    // Build from DB sections, replacing price placeholders
    return kbSections
      .map((s: any) =>
        s.content
          .replace(/\{currency\}/g, currency)
          .replace(/\{memberPrice\}/g, formattedMember)
          .replace(/\{familyPrice\}/g, formattedFamily)
      )
      .join('\n\n');
  }

  // Fallback: return hardcoded English if DB is empty
  return `You are Clara, the friendly customer-facing AI assistant for LifeLink Sync.

STRICT SAFETY AND PRIVACY GUARDRAILS (must always follow):
- Never disclose or discuss anything internal, admin-only, backend, infrastructure, or company-confidential.
- If asked for internal info, politely refuse: "${DEFAULT_SAFETY_MESSAGE}"
- Focus only on public, customer-friendly information.

What LifeLink Sync is:
- Personal emergency protection with privacy-first design
- 24/7 emergency monitoring and notifications to family contacts
- Works with our mobile app, Bluetooth emergency pendant, and compatible smartwatches

Pricing (quoted in ${currency}):
- Member Plan: ${formattedMember}/month — full emergency features, device support, GPS, 24/7 monitoring, priority support
- Family Access: ${formattedFamily}/month — for family members to receive alerts and stay connected

Key Features:
- SOS emergency alerts with SMS, email, and automated calls
- GPS location sharing during emergencies
- Family notifications and check-ins (privacy-controlled)
- Bluetooth pendant: waterproof, up to 6 months battery, one-button SOS
- Multi-language support (English, Spanish, Dutch, etc.)

Style:
- Warm, clear, empathetic, and concise
- Ask clarifying questions when needed and offer next steps
- Always end with an offer to help further`;
}

const convertPrice = (amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number => {
  if (fromCurrency === toCurrency) return amount;
  const amountInEUR = amount / (rates[fromCurrency] || 1);
  return amountInEUR * (rates[toCurrency] || 1);
};

const formatCurrency = (amount: number, currency: string, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
};

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: string;
  conversation_history?: any[];
  language?: string;
  currency?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId, context, language = 'en', currency = 'EUR' }: ChatRequest = await req.json();

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

    // Parse AI settings with defaults
    const settings = aiSettingsData.data?.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as any) || {};

    const temperature = Number(settings.temperature) || 0.7;
    const maxTokens = Number(settings.max_tokens) || 500;
    const model = settings.model || 'gpt-4o-mini';
    const frequencyPenalty = Number(settings.frequency_penalty) || 0;
    const presencePenalty = Number(settings.presence_penalty) || 0;
    const enableLogging = settings.enable_logging !== 'false';
    const rateLimitPerMinute = Number(settings.rate_limit_per_minute) || 60;
    const dailyRequestLimit = Number(settings.daily_request_limit) || 10000;
    const systemPromptMode = settings.system_prompt_mode || 'append';

    // Rate limiting check
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('message_type', 'user')
      .gte('created_at', oneMinuteAgo);

    if (recentCount && recentCount >= rateLimitPerMinute) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: dailyCount } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('message_type', 'user')
      .gte('created_at', todayStart.toISOString());

    if (dailyCount && dailyCount >= dailyRequestLimit) {
      return new Response(
        JSON.stringify({ error: 'Daily request limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation history for context
    const { data: conversationHistory } = await supabase
      .from('conversations')
      .select('message_type, content, created_at')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Store user message with enhanced metadata (if logging enabled)
    if (enableLogging) {
      await supabase
        .from('conversations')
        .insert({
          user_id: userId || null,
          session_id: currentSessionId,
          message_type: 'user',
          content: message,
          metadata: {
            context: context || 'general',
            timestamp: new Date().toISOString(),
            user_agent: req.headers.get('user-agent') || null,
            language,
            currency,
            source_page: context?.includes('homepage') ? 'homepage' :
                        context?.includes('registration') ? 'registration' : 'general'
          }
        });
    }

    // Get active customer-facing training data for enhanced knowledge
    const { data: trainingData } = await supabase
      .from('training_data')
      .select('question, answer, category')
      .eq('status', 'active')
      .eq('audience', 'customer')
      .order('confidence_score', { ascending: false })
      .limit(50);

    // Build knowledge base from DB
    const knowledgeBase = await buildKnowledgeBase(language, currency, currencyRates);

    // Build enhanced knowledge base with training data
    let enhancedKnowledge = knowledgeBase;

    if (trainingData && trainingData.length > 0) {
      const trainingContent = trainingData.map(item =>
        `Q: ${item.question}\nA: ${item.answer}`
      ).join('\n\n');

      enhancedKnowledge += `\n\nADDITIONAL TRAINING DATA:\n${trainingContent}\n\nUse this training data to provide more accurate and detailed responses when relevant.`;
    }

    // Handle custom system prompt (append vs override)
    if (settings.system_prompt && typeof settings.system_prompt === 'string' && settings.system_prompt.trim()) {
      if (systemPromptMode === 'override') {
        enhancedKnowledge = settings.system_prompt;
      } else {
        // Append mode (default) - guardrails are preserved
        enhancedKnowledge += `\n\nADDITIONAL INSTRUCTIONS:\n${settings.system_prompt}`;
      }
    }

    // Build conversation context
    const conversationContext = conversationHistory?.map(msg => ({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })) || [];

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: enhancedKnowledge },
      ...conversationContext,
      { role: 'user', content: message }
    ];

    // Call OpenAI with all settings wired
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
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

    // Post-filter using DB-driven restricted patterns
    let sanitized = aiResponse;
    for (const { regex, message: replacementMsg } of restrictedPatterns) {
      if (regex.test(sanitized)) {
        sanitized = replacementMsg;
        break;
      }
    }

    // Store AI response (if logging enabled)
    if (enableLogging) {
      await supabase
        .from('conversations')
        .insert({
          user_id: userId || null,
          session_id: currentSessionId,
          message_type: 'ai',
          content: sanitized
        });
    }

    // Update usage statistics for training data that might have been used
    if (trainingData && trainingData.length > 0) {
      const usedTrainingItems = trainingData.filter(item =>
        aiResponse.toLowerCase().includes(item.answer.toLowerCase().slice(0, 20)) ||
        message.toLowerCase().includes(item.question.toLowerCase().slice(0, 20))
      );

      for (const item of usedTrainingItems) {
        await supabase
          .from('training_data')
          .update({
            usage_count: item.usage_count ? item.usage_count + 1 : 1,
            last_used_at: new Date().toISOString()
          })
          .eq('question', item.question)
          .eq('answer', item.answer);
      }
    }

    // Analyze conversation for lead scoring
    const isShowingInterest = /\b(interested|price|cost|sign up|subscribe|family|emergency|elderly|relative|parent|protection|safety)\b/i.test(message);
    const isAskingQuestions = message.includes('?');

    if (isShowingInterest || isAskingQuestions) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('session_id', currentSessionId)
        .single();

      if (existingLead) {
        await supabase
          .from('leads')
          .update({
            interest_level: Math.min(existingLead.interest_level + 1, 10),
            updated_at: new Date().toISOString()
          })
          .eq('session_id', currentSessionId);
      } else {
        await supabase
          .from('leads')
          .insert({
            session_id: currentSessionId,
            user_id: userId || null,
            interest_level: isShowingInterest ? 3 : 1,
            metadata: { first_message: message }
          });
      }
    }

    // Apply response delay if configured
    const responseDelay = Number(settings.response_delay) || 0;
    if (responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, responseDelay * 1000));
    }

    return new Response(
      JSON.stringify({
        response: sanitized,
        sessionId: currentSessionId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
