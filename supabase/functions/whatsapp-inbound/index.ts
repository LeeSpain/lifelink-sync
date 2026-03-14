import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const twilioSid        = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken      = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom       = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const anthropicApiKey  = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Rate limiting: 10 messages per phone per hour ──────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(phone, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// ── Detect language from message text ──────────────────────────
function detectLanguage(message: string): 'English' | 'Spanish' | 'Dutch' {
  const lower = message.toLowerCase();

  // Count Spanish-only characters and words
  const hasSpanishChars = /[áéíóúüñ¿¡]/.test(lower);
  const spanishOnly = /\b(hola|necesito|ayuda|quiero|precio|madre|padre|emergencia|proteger|seguridad|tengo|puedo|gracias|buenos|dias|buenas|tardes|noches|como|estas|estoy|donde|cuando|porque|tambien|ahora|aqui|bien|mucho|todo|nada|siempre|nunca|pero|para|sobre|desde|hasta|entre|puede|tiene|hace|sabe|cree|vive|solo|sola)\b/g;

  // Count Dutch-only words
  const dutchOnly = /\b(hallo|hulp|nodig|prijs|moeder|vader|nood|bescherming|alstublieft|welkom|goedemorgen|goedemiddag|goedenavond|bedankt|graag|waar|wanneer|waarom|hoe|bent|heeft|kunt|wilt|alleen|woont|valt|bezorgd|angst|ouder|kind|gezin|familie|dringend|gevaarlijk)\b/g;

  const esMatches = (lower.match(spanishOnly) || []).length + (hasSpanishChars ? 2 : 0);
  const nlMatches = (lower.match(dutchOnly) || []).length;

  if (esMatches >= 2) return 'Spanish';
  if (nlMatches >= 2) return 'Dutch';
  return 'English';
}

// ── Strip markdown for clean WhatsApp plain text ───────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
}

// ── Send WhatsApp reply via Twilio ─────────────────────────────
async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const fromNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const replyResult = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: fromNumber,
        From: Deno.env.get('TWILIO_WHATSAPP_FROM')!,
        Body: body,
      }).toString(),
    }
  );

  console.log('Reply send status:', replyResult.status);
  const replyBody = await replyResult.text();
  console.log('Reply send body:', replyBody);

  return replyResult.ok;
}

// ── CLARA system prompt ────────────────────────────────────────
const SYSTEM_PROMPT = `You are CLARA, the AI assistant for LifeLink Sync.

IDENTITY RULES:
- Your name is CLARA (Connected Lifeline And Response Assistant)
- You are an AI assistant, NOT a human
- NEVER say you are Lee Wakeman or any person
- NEVER say "this is Lee" or "I'm Lee" or "Lee here"
- If someone wants to speak to a human, say "I can arrange for Lee, our founder, to contact you personally"

PRODUCT KNOWLEDGE:
- LifeLink Sync is an emergency protection platform for families
- Individual Plan: 9.99 EUR/month
- 7-day free trial, no credit card needed
- Features: one-touch SOS button, GPS tracking, emergency contacts, CLARA AI 24/7
- Bluetooth SOS pendant available (waterproof, 6-month battery)
- Annual billing: 99.90 EUR/year (saves 19.98 EUR — 2 months free)
- First Family Link included free, extras 2.99 EUR/month each
- Available in Spain, UK, and Netherlands

CONVERSATION RULES:
- Be warm, empathetic, and concise
- Understand who they are protecting (themselves, elderly parent, child)
- Connect their specific worry to the exact feature that helps
- Always end with an offer to start the free trial
- Never give medical or legal advice
- If they mention refund/legal/complaint: say "I am flagging this to Lee personally right now" and stop
- Maximum 3 short paragraphs
- No bullet points or lists in WhatsApp — use flowing sentences`;

// ── Amber trigger detection ────────────────────────────────────
const AMBER_TRIGGERS = [
  /\brefund\b/i, /\bcancel\b/i, /\bcompl[ai]+nt\b/i, /\bangry\b/i,
  /\blegal\b/i, /\bgdpr\b/i, /\bdata deletion\b/i, /\bsue\b/i,
  /\blawyer\b/i, /\bfraud\b/i, /\bcharged twice\b/i,
];

function detectAmberTrigger(text: string): string | null {
  for (const re of AMBER_TRIGGERS) {
    const match = text.match(re);
    if (match) return match[0];
  }
  return null;
}

// ── TwiML empty response ───────────────────────────────────────
const TWIML_OK = '<Response/>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Parse Twilio webhook ───────────────────────────────────
    const text = await req.text();
    const params = new URLSearchParams(text);

    const messageSid  = params.get('MessageSid') ?? '';
    const fromRaw     = params.get('From') ?? '';
    const body        = params.get('Body') ?? '';
    const profileName = params.get('ProfileName') ?? '';
    const phone       = fromRaw.replace('whatsapp:', '');

    console.log('WhatsApp inbound:', { phone, bodyLength: body.length });

    if (!phone || !body.trim()) {
      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Rate limit ─────────────────────────────────────────────
    if (!checkRateLimit(phone)) {
      const entry = rateLimits.get(phone);
      if (entry && entry.count === 10) {
        entry.count++;
        await sendWhatsApp(phone, 'I want to help — please give me a moment and try again shortly.');
      }
      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Check if first contact — send greeting ─────────────────
    const { data: existingConv } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phone)
      .eq('status', 'active')
      .maybeSingle();

    const isFirstContact = !existingConv;

    if (isFirstContact) {
      const detectedLang = detectLanguage(body);
      const greetings: Record<string, string> = {
        English: `Hello! I'm CLARA — Connected Lifeline And Response Assistant.

I'm the AI assistant for LifeLink Sync, our emergency protection platform. Think of me as your 24/7 guide who knows everything about keeping you and your loved ones safe.

I can help you understand how our emergency system works, answer questions about our plans and features, or get you started with a free 7-day trial if you're ready.

Let me read your message and respond properly now...`,
        Spanish: `Hola! Soy CLARA — Connected Lifeline And Response Assistant.

Soy la asistente de IA de LifeLink Sync, nuestra plataforma de proteccion de emergencias. Piensa en mi como tu guia 24/7 que sabe todo sobre como mantener seguros a ti y a tus seres queridos.

Puedo ayudarte a entender como funciona nuestro sistema de emergencia, responder preguntas sobre planes y funciones, o ayudarte a empezar con una prueba gratuita de 7 dias.

Deja que lea tu mensaje y te responda ahora...`,
        Dutch: `Hallo! Ik ben CLARA — Connected Lifeline And Response Assistant.

Ik ben de AI-assistent van LifeLink Sync, ons noodbeschermingsplatform. Beschouw mij als je 24/7 gids die alles weet over het veilig houden van jou en je dierbaren.

Ik kan je helpen begrijpen hoe ons noodsysteem werkt, vragen beantwoorden over plannen en functies, of je helpen starten met een gratis proefperiode van 7 dagen.

Laat me je bericht lezen en je nu goed antwoorden...`,
      };
      await sendWhatsApp(phone, greetings[detectedLang] ?? greetings['English']);
    }

    // ── Detect language and build user message ─────────────────
    const detectedLang = detectLanguage(body);
    const langInstruction = `[RESPOND IN ${detectedLang.toUpperCase()} ONLY. DO NOT USE ANY OTHER LANGUAGE.]\n\n`;
    const userMessage = langInstruction + body;

    const currentSessionId = `wa-${phone}`;

    // ── Call Claude ─────────────────────────────────────────────
    let aiResponse: string;
    const triggerWord = detectAmberTrigger(body);
    const isEscalation = !!triggerWord;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 250,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) throw new Error(`Claude ${response.status}`);
      const data = await response.json();
      aiResponse = stripMarkdown(data.content?.[0]?.text ?? '');
    } catch (aiErr) {
      console.error('Claude error:', aiErr);
      await sendWhatsApp(phone, 'Sorry, I am having a technical issue. Please try again in a moment.');
      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Send reply ─────────────────────────────────────────────
    const sent = await sendWhatsApp(phone, aiResponse);
    console.log('Reply sent:', { phone, sent, escalation: isEscalation, lang: detectedLang });

    // ── Background: log + memory + escalation ──────────────────
    const bg: Promise<unknown>[] = [];

    // Log conversation
    bg.push((async () => {
      try {
        const { data: conv } = await supabase
          .from('whatsapp_conversations')
          .select('id')
          .eq('phone_number', phone)
          .eq('status', 'active')
          .maybeSingle();

        let convId = conv?.id;
        if (!convId) {
          const { data: newConv } = await supabase
            .from('whatsapp_conversations')
            .insert({ phone_number: phone, contact_name: profileName || null, status: 'active', metadata: { source: 'twilio_sandbox' } })
            .select('id')
            .single();
          convId = newConv?.id;
        } else {
          await supabase.from('whatsapp_conversations')
            .update({ last_message_at: new Date().toISOString(), contact_name: profileName || undefined })
            .eq('id', convId);
        }

        if (convId) {
          await Promise.allSettled([
            supabase.from('whatsapp_messages').insert({ conversation_id: convId, whatsapp_message_id: messageSid, direction: 'inbound', message_type: 'text', content: body, status: 'delivered' }),
            supabase.from('whatsapp_messages').insert({ conversation_id: convId, direction: 'outbound', message_type: 'text', content: aiResponse, status: sent ? 'sent' : 'failed', is_ai_generated: true, ai_session_id: currentSessionId }),
          ]);
        }
      } catch (e) { console.warn('Log failed:', e); }
    })());

    // Memory upsert
    bg.push(
      supabase.functions.invoke('clara-memory', {
        body: {
          action: 'upsert',
          session_id: currentSessionId,
          contact_phone: phone,
          first_name: profileName || null,
          language: detectedLang.toLowerCase().substring(0, 2),
          currency: 'EUR',
          last_outcome: `WhatsApp: "${body.substring(0, 80)}"`,
          interest_score: 0,
          amber_triggered: isEscalation,
          ...(triggerWord ? { amber_trigger_word: triggerWord } : {}),
        },
      }).catch(e => console.warn('Memory failed:', e))
    );

    // Escalation
    if (isEscalation) {
      bg.push(
        supabase.functions.invoke('clara-escalation', {
          body: {
            type: 'amber',
            session_id: currentSessionId,
            contact_name: profileName || phone,
            contact_phone: phone,
            trigger_word: triggerWord,
            last_message: body,
            clara_recommendation: 'WhatsApp amber trigger — handle personally',
          },
        }).catch(e => console.warn('Escalation failed:', e))
      );
    }

    await Promise.race([
      Promise.allSettled(bg),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);

    return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('whatsapp-inbound error:', error);
    return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
  }
});
