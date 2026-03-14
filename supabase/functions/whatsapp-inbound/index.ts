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

    // ── Find or create whatsapp_conversation ───────────────────
    let conversationId: string;

    const { data: existingConv } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phone)
      .eq('status', 'active')
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      await supabase
        .from('whatsapp_conversations')
        .update({ last_message_at: new Date().toISOString(), contact_name: profileName || undefined })
        .eq('id', conversationId);
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from('whatsapp_conversations')
        .insert({
          phone_number: phone,
          contact_name: profileName || null,
          status: 'active',
          metadata: { source: 'twilio_sandbox', language },
        })
        .select('id')
        .single();

      if (convErr) {
        console.error('Failed to create conversation:', convErr);
        return new Response(TWIML_OK, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }
      conversationId = newConv.id;
    }

    // ── Log inbound message ────────────────────────────────────
    await supabase.from('whatsapp_messages').insert({
      conversation_id: conversationId,
      whatsapp_message_id: messageSid,
      direction: 'inbound',
      message_type: 'text',
      content: body,
      status: 'delivered',
      metadata: { profile_name: profileName, language },
    });

    // ── Get CLARA memory for this contact ──────────────────────
    let sessionId: string | null = null;
    try {
      const memRes = await supabase.functions.invoke('clara-memory', {
        body: { action: 'get', contact_phone: phone },
      });
      if (memRes.data?.has_memory) {
        // Memory exists — retrieve session for continuity
        sessionId = memRes.data?.memory_summary ? `wa-${phone}` : null;
      }
    } catch (memErr) {
      console.warn('Memory lookup failed (non-fatal):', memErr);
    }

    // Use stable session ID per phone number
    const currentSessionId = sessionId ?? `wa-${phone}`;

    // ── Call ai-chat for CLARA response ────────────────────────
    const { data: chatData, error: chatErr } = await supabase.functions.invoke('ai-chat', {
      body: {
        message: body,
        sessionId: currentSessionId,
        userId: null,
        context: `whatsapp - Contact: ${profileName || phone}`,
        language,
        currency: 'EUR',
      },
    });

    if (chatErr) {
      console.error('ai-chat invoke error:', chatErr);
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

    const aiResponse = stripMarkdown(chatData?.response ?? 'Sorry, I could not process that. Please try again.');
    const provider = chatData?.provider ?? 'unknown';
    const isEscalation = chatData?.escalation === true;
    const triggerWord = chatData?.trigger ?? null;

    // ── Send CLARA response via WhatsApp ───────────────────────
    const sent = await sendWhatsApp(phone, aiResponse);

    // ── Log outbound message ───────────────────────────────────
    await supabase.from('whatsapp_messages').insert({
      conversation_id: conversationId,
      direction: 'outbound',
      message_type: 'text',
      content: aiResponse,
      status: sent ? 'sent' : 'failed',
      is_ai_generated: true,
      ai_session_id: currentSessionId,
      metadata: { provider, language },
    });

    // ── Update CLARA memory ────────────────────────────────────
    try {
      await supabase.functions.invoke('clara-memory', {
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
      });
    } catch (memSaveErr) {
      console.warn('Memory save failed (non-fatal):', memSaveErr);
    }

    // ── Fire escalation if amber triggered ─────────────────────
    if (isEscalation) {
      try {
        await supabase.functions.invoke('clara-escalation', {
          body: {
            type: 'amber',
            session_id: currentSessionId,
            contact_name: profileName || phone,
            contact_phone: phone,
            trigger_word: triggerWord,
            last_message: body,
            clara_recommendation: 'WhatsApp amber trigger — handle personally',
          },
        });
      } catch (escErr) {
        console.warn('Escalation failed (non-fatal):', escErr);
      }
    }

    console.log('WhatsApp handled:', { phone, language, provider, sent, escalation: isEscalation });

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
