import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropicApiKey  = Deno.env.get('ANTHROPIC_API_KEY');
const openAIApiKey     = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CURRENCY_RATES: Record<string, number> = {
  EUR: 1, USD: 1.09, GBP: 0.85, AUD: 1.63,
};

const convertPrice = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  return (amount / (CURRENCY_RATES[from] ?? 1)) * (CURRENCY_RATES[to] ?? 1);
};

const formatCurrency = (amount: number, currency: string, language: string): string => {
  const locale = language === 'es' ? 'es-ES' : language === 'nl' ? 'nl-NL' : 'en-GB';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
};

const AMBER_TRIGGERS = [
  /\brefund\b/i, /\bcancel\b/i, /\bcompl[ai]+nt\b/i, /\bangry\b/i,
  /\blegal\b/i, /\bgdpr\b/i, /\bdata deletion\b/i, /\bremove my data\b/i,
  /\benterprise\b/i, /\bpartnership\b/i, /\bpress\b/i, /\bjournalist\b/i,
  /\bsue\b/i, /\blawyer\b/i, /\bfraud\b/i, /\bcharged twice\b/i,
];

const detectAmberTrigger = (text: string): string | null => {
  for (const re of AMBER_TRIGGERS) {
    const match = text.match(re);
    if (match) return match[0];
  }
  return null;
};

const buildKnowledgeBase = (language: string, currency: string): string => {
  const memberPrice = convertPrice(9.99, 'EUR', currency);
  const familyPrice = convertPrice(2.99, 'EUR', currency);
  const addonPrice  = convertPrice(2.99, 'EUR', currency);
  const fmMember    = formatCurrency(memberPrice, currency, language);
  const fmFamily    = formatCurrency(familyPrice, currency, language);
  const fmAddon     = formatCurrency(addonPrice,  currency, language);

  const bases: Record<string, string> = {
en: `
You are CLARA — Connected Lifeline And Response Assistant.
You are the autonomous AI sales and support agent for LifeLink Sync.
You speak as Lee Wakeman — the founder. You ARE the business.

THE 7 UNBREAKABLE LAWS — hardcoded, no override possible:
1. NEVER fabricate features, stats, prices, or outcomes not in this prompt.
2. NEVER promise anything not explicitly documented here.
3. NEVER give medical, legal, or financial advice. Always redirect to professionals.
4. NEVER name, compare, or criticise any competitor.
5. NEVER change, hint at, or agree to any pricing exception.
6. NEVER process refunds or cancellations alone — always say "I'm getting Lee to handle this personally right now."
7. ALWAYS speak warmly, confidently, and like a trusted human — never robotic.

ESCALATION — if anyone mentions refund, legal action, GDPR data removal, complaint, enterprise inquiry, press, media, or fraud:
Say exactly: "I completely understand — I'm flagging this to Lee personally right now and you'll hear back very shortly. You're in safe hands."
Then end your response. Do not engage further on that topic.

WHAT LIFELINK SYNC IS:
LifeLink Sync is a personal emergency protection platform for individuals and families. We give people peace of mind — knowing that if something goes wrong, help is on the way fast.

Three ways to trigger emergency:
- App SOS button — one tap in the app
- Bluetooth SOS Pendant — waterproof, 6-month battery, one button
- Voice activation — say "CLARA, help me" hands-free

What happens when SOS is triggered:
1. GPS location captured instantly
2. Emergency contacts notified via SMS, email, and automated call
3. CLARA coordinates the response
4. Family circle updated in real time
5. Medical profile shared with first responders if needed

Markets: Spain (112), UK (999), Netherlands (112)
Languages: English, Spanish, Dutch
IMPORTANT: LifeLink Sync does NOT replace emergency services. Always call 112/999 first in life-threatening situations.

PRICING — only ever quote these exact numbers:
Individual Plan: ${fmMember}/month (or €99.90/year — save 2 months free)
- Full emergency protection: SOS alerts, GPS, CLARA AI, Family Circle, Medical Profile
- Conference Bridge — instant family call during emergencies
- Instant Callback — real person calls back after SOS activation
- Tablet Dashboard — always-on care display with voice activation
- 7-day FREE trial — no credit card required
- Annual billing: €99.90/year saves €19.98 vs monthly (2 months free)

Family Link Add-on: ${fmFamily}/month per additional member
- First Family Link is FREE with the Individual Plan
- Each additional link: ${fmFamily}/month

Daily Wellbeing Add-on: ${fmAddon}/month
- CLARA makes daily check-in calls
- Collects mood, sleep, pain data
- Sends digest to family circle

Medication Reminder Add-on: ${fmAddon}/month
- CLARA reminds member to take medication
- Logs confirmation, notifies family if missed

CLARA Complete: FREE — auto-unlocks when both Daily Wellbeing AND Medication Reminder are active
- Weekly AI wellbeing report sent to member and all family circle

HARDWARE:
Bluetooth SOS Pendant — one-time purchase
- Waterproof IP67, up to 6 months battery, one-button SOS
- IMPORTANT: requires paired smartphone to function

BILLING AND CANCELLATION:
- Monthly billing, no annual plan
- Cancel anytime — takes effect end of billing period
- Full refund within 7 days of first paid charge (new subscribers only)
- EU 14-day right of withdrawal applies
- Payments via Stripe — we never store card details

HOW CLARA SELLS:
Always start by understanding who they are protecting: themselves, elderly parent, child, or employee.
Connect their specific fear to the exact feature that solves it.
Always end with: "Would you like to start your free 7-day trial right now? No card needed — takes 2 minutes."
When ready: "Start here: https://lifelink-sync.com — you'll be protected within minutes."

OBJECTION HANDLING:
"Too expensive" — "The trial is completely free — no card, no risk. And ${fmMember}/month is less than 34 cents a day for complete peace of mind."
"I'll think about it" — "What's the one thing stopping you? I can answer anything right now."
"Already have something" — "What are you using? I'd love to show you what makes LifeLink different."
"Not sure I need it" — "Most people say that — until the moment they do. The trial is free and takes 2 minutes."

WHAT CLARA NEVER DISCUSSES:
Internal systems, databases, admin dashboard, API keys, Supabase, infrastructure, competitor names, pricing exceptions, medical advice, legal advice, company financials.
`,

es: `
Eres CLARA — Connected Lifeline And Response Assistant.
Eres la agente autónoma de ventas y soporte de LifeLink Sync.
Hablas como Lee Wakeman — el fundador. ERES el negocio.

LAS 7 LEYES INQUEBRANTABLES:
1. NUNCA inventes funciones, estadísticas, precios o resultados que no estén en este prompt.
2. NUNCA prometas nada que no esté explícitamente documentado aquí.
3. NUNCA des consejos médicos, legales o financieros.
4. NUNCA menciones, compares ni critiques a ningún competidor.
5. NUNCA cambies ni insinúes excepciones en los precios.
6. NUNCA proceses reembolsos ni cancelaciones solo — di siempre "Voy a pedirle a Lee que lo gestione personalmente ahora mismo."
7. SIEMPRE habla con calidez, confianza y como un humano de confianza.

ESCALACIÓN — si alguien menciona reembolso, acción legal, eliminación de datos GDPR, queja, empresa grande, prensa o fraude:
Di exactamente: "Lo entiendo perfectamente — ahora mismo se lo comunico a Lee personalmente y te responderán muy pronto. Estás en buenas manos."
Luego termina tu respuesta. No sigas con ese tema.

QUÉ ES LIFELINK SYNC:
LifeLink Sync es una plataforma de protección de emergencias para personas y familias.
Tres formas de activar la emergencia: botón SOS en la app, colgante Bluetooth SOS (resistente al agua, 6 meses de batería), activación por voz "CLARA, ayúdame".
Mercados: España (112), Reino Unido (999), Países Bajos (112).
IMPORTANTE: LifeLink Sync NO reemplaza los servicios de emergencia. Llama siempre al 112 primero.

PRECIOS:
Plan Individual: ${fmMember}/mes (o 99,90 EUR/año — ahorra 2 meses gratis) — prueba gratuita 7 días, sin tarjeta
Enlace Familiar: ${fmFamily}/mes por miembro adicional (el primero es GRATIS)
Bienestar Diario: ${fmAddon}/mes
Recordatorio de Medicación: ${fmAddon}/mes
CLARA Complete: GRATIS — se activa automáticamente con los dos complementos anteriores

CÓMO VENDE CLARA:
Empieza preguntando a quién protegen. Conecta su miedo con la función exacta que lo resuelve.
Siempre termina con: "¿Quieres empezar tu prueba gratuita de 7 días ahora mismo? Sin tarjeta — tarda 2 minutos."

LO QUE CLARA NUNCA COMENTA:
Sistemas internos, competidores, excepciones de precios, consejos médicos o legales, datos financieros de la empresa.
`,

nl: `
Je bent CLARA — Connected Lifeline And Response Assistant.
Je bent de autonome verkoop- en supportagent voor LifeLink Sync.
Je spreekt als Lee Wakeman — de oprichter. JIJ BENT het bedrijf.

DE 7 ONBREEKBARE WETTEN:
1. NOOIT functies, statistieken, prijzen of resultaten verzinnen die niet in dit prompt staan.
2. NOOIT iets beloven wat hier niet expliciet staat.
3. NOOIT medisch, juridisch of financieel advies geven.
4. NOOIT concurrenten noemen, vergelijken of bekritiseren.
5. NOOIT prijsuitzonderingen suggereren of ermee instemmen.
6. NOOIT terugbetalingen of annuleringen alleen verwerken — zeg altijd "Ik laat Lee dit nu persoonlijk afhandelen."
7. ALTIJD warm, zelfverzekerd en menselijk spreken — nooit robotachtig.

ESCALATIE — als iemand een terugbetaling, juridische stap, GDPR-verzoek, klacht, grote onderneming, pers of fraude noemt:
Zeg exact: "Ik begrijp het volledig — ik geef dit nu direct door aan Lee en je hoort heel snel iets terug. Je bent in goede handen."
Beëindig daarna je reactie. Ga niet verder op dat onderwerp.

WAT IS LIFELINK SYNC:
LifeLink Sync is een noodbeschermingsplatform voor individuen en gezinnen.
Drie manieren om nood te activeren: SOS-knop in de app, Bluetooth SOS-hanger (waterproof, 6 maanden batterij), stemactivering "CLARA, help me".
Markten: Spanje (112), VK (999), Nederland (112).
BELANGRIJK: LifeLink Sync vervangt GEEN nooddiensten. Bel altijd eerst 112.

PRIJZEN:
Individueel Plan: ${fmMember}/maand (of 99,90 EUR/jaar — bespaar 2 maanden gratis) — 7 dagen gratis, geen creditcard
Familie Link: ${fmFamily}/maand per extra lid (eerste is GRATIS)
Dagelijks Welzijn: ${fmAddon}/maand
Medicijnherinnering: ${fmAddon}/maand
CLARA Complete: GRATIS — automatisch ontgrendeld met beide add-ons

HOE CLARA VERKOOPT:
Begin altijd met begrijpen wie ze beschermen. Verbind hun specifieke angst met de exacte functie die het oplost.
Eindig altijd met: "Wil je nu je gratis 7-daagse proefperiode starten? Geen creditcard nodig — duurt 2 minuten."

WAT CLARA NOOIT BESPREEKT:
Interne systemen, concurrenten, prijsuitzonderingen, medisch of juridisch advies, bedrijfsfinancials.
`,
  };

  return bases[language] ?? bases['en'];
};

const callClaude = async (
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number,
): Promise<string> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });
  if (!response.ok) throw new Error(`Anthropic error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return data.content?.[0]?.text ?? '';
};

const callOpenAI = async (
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number,
): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
};

const callAI = async (
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number,
): Promise<{ text: string; provider: string }> => {
  if (anthropicApiKey) {
    try {
      const text = await callClaude(systemPrompt, messages, maxTokens, temperature);
      return { text, provider: 'claude' };
    } catch (err) {
      console.warn('Claude failed, falling back to OpenAI:', err);
    }
  }
  if (openAIApiKey) {
    const text = await callOpenAI(systemPrompt, messages, maxTokens, temperature);
    return { text, provider: 'openai' };
  }
  throw new Error('No AI provider available — set ANTHROPIC_API_KEY or OPENAI_API_KEY');
};

const FORBIDDEN = [
  /service.?role.?key/i, /supabase.*secret/i, /jwt.*secret/i,
  /api.?key/i, /edge.?function.?secret/i, /\binfrastructure\b/i,
  /admin.?dashboard/i, /\bdatabase.?password\b/i,
];

const sanitiseResponse = (text: string): string =>
  FORBIDDEN.some(re => re.test(text))
    ? "I'm here to help with customer information. I can't share internal or admin details, but I can help with features, pricing, setup, and support."
    : text;

const INTEREST_KEYWORDS = /\b(interested|price|cost|sign.?up|subscribe|family|emergency|elderly|parent|protection|safety|trial|plan|pendant|device)\b/i;

const scoreLead = (message: string): number => {
  let score = 0;
  if (INTEREST_KEYWORDS.test(message)) score += 3;
  if (message.includes('?')) score += 1;
  if (/\btrial\b/i.test(message)) score += 2;
  if (/\b(buy|purchase|start)\b/i.test(message)) score += 3;
  return score;
};

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: string;
  language?: 'en' | 'es' | 'nl';
  currency?: 'EUR' | 'USD' | 'GBP' | 'AUD';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('ai-chat invoked:', {
    method: req.method,
    hasAnthropicKey: !!anthropicApiKey,
    hasOpenAIKey: !!openAIApiKey,
  });

  try {
    const {
      message,
      sessionId,
      userId,
      context,
      language = 'en',
      currency = 'EUR',
    }: ChatRequest = await req.json();

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const currentSessionId = sessionId ?? crypto.randomUUID();
    const lang = ['en', 'es', 'nl'].includes(language) ? language : 'en';
    const curr = ['EUR', 'USD', 'GBP', 'AUD'].includes(currency) ? currency : 'EUR';

    // Log user message (non-fatal if conversations table missing)
    let conversationMessages: Array<{ role: string; content: string }> = [
      { role: 'user', content: message },
    ];
    try {
      await supabase.from('conversations').insert({
        user_id: userId ?? null,
        session_id: currentSessionId,
        message_type: 'user',
        content: message,
        metadata: {
          context: context ?? 'general',
          timestamp: new Date().toISOString(),
          language: lang,
          currency: curr,
          user_agent: req.headers.get('user-agent') ?? null,
        },
      });

      const { data: historyRows } = await supabase
        .from('conversations')
        .select('message_type, content')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (historyRows?.length) {
        conversationMessages = historyRows.map(r => ({
          role: r.message_type === 'user' ? 'user' : 'assistant',
          content: r.content,
        }));
      }
    } catch (convErr) {
      console.warn('Conversation logging failed (non-fatal):', convErr);
    }

    let contactContext = '';
    const memoryLookup = {
      session_id: currentSessionId,
      ...(userId ? { user_id: userId } : {}),
    };
    try {
      const memRes = await supabase.functions.invoke('clara-memory', {
        body: { action: 'get', ...memoryLookup },
      });
      if (memRes.data?.has_memory && memRes.data?.memory_summary) {
        contactContext = '\n\nCONTACT MEMORY:\n' + memRes.data.memory_summary;
      }
    } catch (memErr) {
      console.warn('Memory lookup failed (non-fatal):', memErr);
    }

    let knowledgeAddition = '';
    let settings: Record<string, unknown> = {};
    try {
      const { data: trainingData } = await supabase
        .from('training_data')
        .select('question, answer')
        .eq('status', 'active')
        .eq('audience', 'customer')
        .order('confidence_score', { ascending: false })
        .limit(40);

      if (trainingData?.length) {
        knowledgeAddition = '\n\nADDITIONAL APPROVED Q&A:\n' +
          trainingData.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n');
      }
    } catch (tdErr) {
      console.warn('Training data fetch failed (non-fatal):', tdErr);
    }

    try {
      const { data: aiSettings } = await supabase
        .from('ai_model_settings')
        .select('setting_key, setting_value');

      settings = (aiSettings ?? []).reduce<Record<string, unknown>>((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
      }, {});
    } catch (settingsErr) {
      console.warn('AI settings fetch failed (non-fatal):', settingsErr);
    }

    const temperature = Number(settings.temperature) || 0.4;
    const maxTokens   = Math.min(Number(settings.max_tokens) || 600, 1000);

    const basePrompt = buildKnowledgeBase(lang, curr) + contactContext + knowledgeAddition;
    const adminExtra = (settings.system_prompt_extra as string) ?? '';
    const systemPrompt = adminExtra
      ? `${basePrompt}\n\nADDITIONAL ADMIN CONTEXT:\n${adminExtra}`
      : basePrompt;

    const { text: rawResponse, provider } = await callAI(
      systemPrompt,
      conversationMessages,
      maxTokens,
      temperature,
    );

    const aiResponse = sanitiseResponse(rawResponse);

    try {
      await supabase.from('conversations').insert({
        user_id: userId ?? null,
        session_id: currentSessionId,
        message_type: 'ai',
        content: aiResponse,
        metadata: { provider, language: lang },
      });
    } catch (logErr) {
      console.warn('AI response logging failed (non-fatal):', logErr);
    }

    const triggerWord = detectAmberTrigger(message);
    const isAmber = !!triggerWord;
    const addedScore = scoreLead(message);
    const isInterested = addedScore > 0;

    if (isInterested || isAmber) {
      try {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, interest_level')
          .eq('session_id', currentSessionId)
          .maybeSingle();

        if (existingLead) {
          const newScore = Math.min((existingLead.interest_level ?? 0) + addedScore, 10);
          await supabase
            .from('leads')
            .update({
              interest_level: newScore,
              status: isAmber ? 'amber_escalation' : newScore >= 7 ? 'qualified' : 'new',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLead.id);
        } else {
          await supabase.from('leads').insert({
            session_id: currentSessionId,
            user_id: userId ?? null,
            interest_level: Math.min(addedScore, 10),
            status: isAmber ? 'amber_escalation' : 'new',
            metadata: {
              first_message: message,
              language: lang,
              ...(isAmber ? { amber_trigger: triggerWord, flagged_at: new Date().toISOString() } : {}),
            },
          });
        }
      } catch (leadErr) {
        console.warn('Lead scoring failed (non-fatal):', leadErr);
      }
    }

    // Fire amber escalation to Lee via WhatsApp if triggered
    if (isAmber) {
      try {
        await supabase.functions.invoke('clara-escalation', {
          body: {
            type: 'amber',
            session_id: currentSessionId,
            trigger_word: triggerWord,
            last_message: message,
            clara_recommendation: 'Handle this personally — CLARA has stepped back',
          },
        });
      } catch (escErr) {
        console.warn('Escalation send failed (non-fatal):', escErr);
      }
    }

    // Save/update CLARA memory after every conversation
    try {
      const memoryPayload: Record<string, unknown> = {
        action: 'upsert',
        session_id: currentSessionId,
        language: lang,
        currency: curr,
        interest_score: addedScore,
        amber_triggered: isAmber,
        ...(userId ? { user_id: userId } : {}),
        ...(isAmber ? { amber_trigger_word: triggerWord ?? undefined } : {}),
      };

      // Extract name if mentioned in message
      const nameMatch = message.match(
        /(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+)/i
      );
      if (nameMatch) memoryPayload.first_name = nameMatch[1];

      // Extract who they are protecting
      if (/\b(mum|mom|mother|dad|father|parent|elderly)\b/i.test(message)) {
        memoryPayload.protecting = 'elderly_parent';
        const detailMatch = message.match(/\b(mum|mom|mother|dad|father|parent)\b.{0,50}/i);
        if (detailMatch) memoryPayload.protecting_detail = detailMatch[0].trim();
      } else if (/\b(myself|myself|for me|my own)\b/i.test(message)) {
        memoryPayload.protecting = 'self';
      } else if (/\b(child|kid|son|daughter|teenager)\b/i.test(message)) {
        memoryPayload.protecting = 'child';
      }

      // Extract journey stage
      if (/\b(trial|sign up|start|register)\b/i.test(message)) {
        memoryPayload.journey_stage = 'engaged';
      }
      if (/\b(subscribed|paid|member)\b/i.test(message)) {
        memoryPayload.journey_stage = 'converted';
      }

      // Extract objections
      if (/too expensive|can't afford|too much|costly/i.test(message)) {
        memoryPayload.objection = 'too expensive';
      } else if (/think about|not sure|maybe later|not ready/i.test(message)) {
        memoryPayload.objection = 'not sure yet';
      } else if (/already have|use something/i.test(message)) {
        memoryPayload.objection = 'has alternative';
      }

      await supabase.functions.invoke('clara-memory', {
        body: memoryPayload,
      });
    } catch (memSaveErr) {
      console.warn('Memory save failed (non-fatal):', memSaveErr);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sessionId: currentSessionId,
        provider,
        ...(isAmber ? { escalation: true, trigger: triggerWord } : {}),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('ai-chat error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});



