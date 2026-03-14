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

// ── Language detection from phone country code ─────────────────
function detectLanguage(phone: string): 'en' | 'es' | 'nl' {
  if (phone.startsWith('+34')) return 'es';
  if (phone.startsWith('+31')) return 'nl';
  return 'en';
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
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const encoded = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: twilioFrom,
    Body: body,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encoded.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Twilio send error:', err);
    return false;
  }
  return true;
}

// ── Direct Claude API call (no function-to-function overhead) ──
async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 250,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!response.ok) throw new Error(`Claude error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

// ── Compact WhatsApp system prompt ─────────────────────────────
function getWhatsAppPrompt(lang: string): string {
  if (lang === 'es') return `Eres CLARA de LifeLink Sync. Hablas como Lee Wakeman, el fundador. Eres calida, directa y humana. Proteccion de emergencia para familias. Plan Individual: 9,99 EUR/mes. Prueba gratuita 7 dias sin tarjeta. SOS, GPS, contactos de emergencia, CLARA IA 24/7. Siempre pregunta a quien protegen. Termina ofreciendo la prueba gratuita. Nunca des consejos medicos ni legales. Si mencionan reembolso/legal/queja, di que Lee lo gestionara personalmente. Responde en espanol. Maximo 3 parrafos cortos.`;
  if (lang === 'nl') return `Je bent CLARA van LifeLink Sync. Je spreekt als Lee Wakeman, de oprichter. Warm, direct en menselijk. Noodbescherming voor gezinnen. Individueel Plan: 9,99 EUR/maand. 7 dagen gratis, geen creditcard. SOS, GPS, noodcontacten, CLARA AI 24/7. Vraag altijd wie ze beschermen. Eindig met gratis proefperiode. Nooit medisch of juridisch advies. Bij terugbetaling/klacht/juridisch: Lee handelt het persoonlijk af. Antwoord in het Nederlands. Maximaal 3 korte alinea's.`;
  return `You are CLARA from LifeLink Sync. You speak as Lee Wakeman, the founder. Warm, direct, human. Emergency protection for families. Individual Plan: 9.99 EUR/month. 7-day free trial, no card needed. SOS alerts, GPS, emergency contacts, CLARA AI 24/7. Always ask who they are protecting. End by offering the free trial. Never give medical or legal advice. If they mention refund/legal/complaint, say Lee will handle it personally. Keep replies to 3 short paragraphs max.`;
}

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

// ── TwiML empty response (acknowledges receipt) ────────────────
const TWIML_OK = '<Response/>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('whatsapp-inbound invoked:', { method: req.method });

  try {
    // ── Parse Twilio form-encoded POST ─────────────────────────
    const text = await req.text();
    const params = new URLSearchParams(text);

    const messageSid = params.get('MessageSid') ?? '';
    const fromRaw    = params.get('From') ?? '';       // whatsapp:+34643706877
    const body       = params.get('Body') ?? '';
    const profileName = params.get('ProfileName') ?? '';

    // Strip "whatsapp:" prefix to get raw phone
    const phone = fromRaw.replace('whatsapp:', '');

    console.log('Inbound WhatsApp:', { phone, profileName, bodyLength: body.length, messageSid });

    if (!phone || !body.trim()) {
      return new Response(TWIML_OK, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // ── Rate limit check ───────────────────────────────────────
    if (!checkRateLimit(phone)) {
      console.warn('Rate limited:', phone);
      // Send one polite message (only on the 11th attempt)
      const entry = rateLimits.get(phone);
      if (entry && entry.count === 10) {
        entry.count++; // increment past 10 so we only send once
        await sendWhatsApp(phone,
          'I want to help — please give me a moment and try again shortly.'
        );
      }
      return new Response(TWIML_OK, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // ── Detect language from country code ──────────────────────
    const language = detectLanguage(phone);

    // Use stable session ID per phone number
    const currentSessionId = `wa-${phone}`;

    // ── Call Claude FIRST (fastest path to reply) ──────────────
    // DB logging happens in parallel / after reply
    let aiResponse: string;
    const triggerWord = detectAmberTrigger(body);
    const isEscalation = !!triggerWord;

    try {
      const rawResponse = await callClaude(getWhatsAppPrompt(language), body);
      aiResponse = stripMarkdown(rawResponse);
    } catch (aiErr) {
      console.error('Claude API error:', aiErr);
      await sendWhatsApp(phone,
        language === 'es'
          ? 'Disculpa, estoy teniendo un problema tecnico. Intentalo de nuevo en un momento.'
          : language === 'nl'
            ? 'Sorry, ik heb een technisch probleem. Probeer het over een moment opnieuw.'
            : 'Sorry, I am having a technical issue. Please try again in a moment.'
      );
      return new Response(TWIML_OK, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // ── Send CLARA response via WhatsApp ───────────────────────
    const sent = await sendWhatsApp(phone, aiResponse);

    console.log('WhatsApp handled:', { phone, language, sent, escalation: isEscalation });

    // ── Log conversation + messages AFTER reply sent ───────────
    // Find or create conversation, then log both messages
    let conversationId: string | null = null;
    try {
      const { data: existingConv } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('phone_number', phone)
        .eq('status', 'active')
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
        supabase.from('whatsapp_conversations')
          .update({ last_message_at: new Date().toISOString(), contact_name: profileName || undefined })
          .eq('id', conversationId).then(() => {});
      } else {
        const { data: newConv } = await supabase
          .from('whatsapp_conversations')
          .insert({ phone_number: phone, contact_name: profileName || null, status: 'active', metadata: { source: 'twilio_sandbox', language } })
          .select('id')
          .single();
        conversationId = newConv?.id ?? null;
      }

      if (conversationId) {
        // Log both messages in parallel
        await Promise.allSettled([
          supabase.from('whatsapp_messages').insert({ conversation_id: conversationId, whatsapp_message_id: messageSid, direction: 'inbound', message_type: 'text', content: body, status: 'delivered', metadata: { profile_name: profileName, language } }),
          supabase.from('whatsapp_messages').insert({ conversation_id: conversationId, direction: 'outbound', message_type: 'text', content: aiResponse, status: sent ? 'sent' : 'failed', is_ai_generated: true, ai_session_id: currentSessionId, metadata: { language } }),
        ]);
      }
    } catch (logErr) {
      console.warn('Conversation logging failed (non-fatal):', logErr);
    }

    // ── Fire-and-forget: memory + escalation (after reply sent) ─
    // These run in background — don't block the TwiML response
    const backgroundTasks: Promise<unknown>[] = [];

    backgroundTasks.push(
      supabase.functions.invoke('clara-memory', {
        body: {
          action: 'upsert',
          session_id: currentSessionId,
          contact_phone: phone,
          first_name: profileName || null,
          language,
          currency: 'EUR',
          last_outcome: `WhatsApp: "${body.substring(0, 80)}"`,
          interest_score: 0,
          amber_triggered: isEscalation,
          ...(triggerWord ? { amber_trigger_word: triggerWord } : {}),
        },
      }).catch(e => console.warn('Memory save failed (non-fatal):', e))
    );

    if (isEscalation) {
      backgroundTasks.push(
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
        }).catch(e => console.warn('Escalation failed (non-fatal):', e))
      );
    }

    // Wait briefly for background tasks but don't block response
    await Promise.race([
      Promise.allSettled(backgroundTasks),
      new Promise(resolve => setTimeout(resolve, 3000)), // 3s max wait
    ]);

    // ── Return TwiML to acknowledge ────────────────────────────
    return new Response(TWIML_OK, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('whatsapp-inbound error:', error);
    return new Response(TWIML_OK, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  }
});
