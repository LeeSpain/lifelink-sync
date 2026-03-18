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
- Features: one-touch SOS button, GPS tracking, unlimited emergency contacts, CLARA AI 24/7, voice activation, conference bridge, medical profile, tablet dashboard
- Bluetooth SOS pendant available separately as optional one-time purchase (~€49.99, waterproof, 6-month battery)
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

// ── Voice message transcription via OpenAI Whisper ──────────
async function transcribeVoice(mediaUrl: string): Promise<{ text: string; language: string }> {
  try {
    // Download audio from Twilio (requires auth)
    const audioResp = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
      },
    });
    if (!audioResp.ok) throw new Error(`Audio download ${audioResp.status}`);
    const audioBuffer = await audioResp.arrayBuffer();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.warn('No OPENAI_API_KEY — cannot transcribe voice');
      return { text: '', language: 'en' };
    }

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');
    formData.append('model', 'whisper-1');
    // No language param = auto-detect

    const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}` },
      body: formData,
    });
    if (!whisperResp.ok) throw new Error(`Whisper ${whisperResp.status}`);

    const result = await whisperResp.json();
    return {
      text: result.text?.trim() || '',
      language: result.language || 'en',
    };
  } catch (err) {
    console.error('Voice transcription error:', err);
    return { text: '', language: 'en' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Parse Twilio webhook ───────────────────────────────────
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);

    const messageSid  = params.get('MessageSid') ?? '';
    const fromRaw     = params.get('From') ?? '';
    let body          = params.get('Body') ?? '';
    const profileName = params.get('ProfileName') ?? '';
    const phone       = fromRaw.replace('whatsapp:', '');

    // ── Voice message detection + transcription ────────────────
    const mediaUrl  = params.get('MediaUrl0') ?? '';
    const mediaType = params.get('MediaContentType0') ?? '';
    const isVoice = !!(mediaUrl && (
      mediaType.includes('audio') ||
      mediaType.includes('ogg') ||
      mediaType.includes('mpeg') ||
      mediaType.includes('mp4')
    ));
    let voiceTranscript = '';

    if (isVoice) {
      console.log('Voice message detected from:', phone, 'type:', mediaType);
      const { text: transcribed } = await transcribeVoice(mediaUrl);
      if (transcribed) {
        voiceTranscript = transcribed;
        body = transcribed; // Use transcription as the message body
        console.log('Transcribed voice:', transcribed.substring(0, 100));
      } else {
        // Could not transcribe — send helpful fallback
        await sendWhatsApp(phone,
          '🎤 I received your voice message but couldn\'t transcribe it. Please type your message or try again.\n\n' +
          'Quick commands: leads, revenue, status, chase, budget, campaign, list plans'
        );
        return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
      }
    }

    console.log('WhatsApp inbound:', { phone, bodyLength: body.length, isVoice });

    // ── Route admin messages to dev agent ───────────────────────
    const ADMIN_NUMBER = Deno.env.get('ADMIN_WHATSAPP_NUMBER') ?? '';
    const normalizedFrom = fromRaw.replace('whatsapp:', '').replace('+', '');
    const normalizedAdmin = ADMIN_NUMBER.replace('whatsapp:', '').replace('+', '');
    const bypassAdminRoute = params.get('_bypass_admin_route') === '1';

    if (normalizedAdmin && normalizedFrom === normalizedAdmin && !bypassAdminRoute) {
      // Route to command agent (handles business commands + forwards dev commands)
      const devAgentUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/clara-command-agent';

      // If voice, replace Body in the forwarded payload so dev-agent gets the text
      let forwardBody = rawText;
      if (isVoice && voiceTranscript) {
        const forwardParams = new URLSearchParams(rawText);
        forwardParams.set('Body', voiceTranscript);
        forwardParams.set('_voice_transcript', 'true');
        forwardBody = forwardParams.toString();
      }

      const forwardResponse = await fetch(devAgentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: forwardBody,
      });

      console.log('Forwarded to dev agent:', forwardResponse.status);

      // Send voice confirmation to Lee
      if (isVoice && voiceTranscript) {
        // Dev agent will respond with its own reply, so we just confirm transcription
        // The response will come from dev-agent — no need to double-send
      }

      return new Response('', { status: 200 });
    }

    if (!phone || !body.trim()) {
      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Check for proactive invite replies ─────────────────────
    const { data: activeInvite } = await supabase
      .from('proactive_invites')
      .select('id, contact_name')
      .eq('contact_phone', phone)
      .eq('status', 'active')
      .maybeSingle();

    if (activeInvite) {
      const lower = body.toLowerCase().trim();
      if (['yes', 'y', 'sí', 'si', 'ja', '👍'].includes(lower)) {
        // Convert — mark invite and route to signup
        await supabase.from('proactive_invites')
          .update({ status: 'converted', converted_at: new Date().toISOString() })
          .eq('id', activeInvite.id);

        const leeNum = Deno.env.get('TWILIO_WHATSAPP_LEE')!;
        const convLang = detectLanguage(body);
        const yesReplies: Record<string, string> = {
          English: "That's great! Let me get you set up right now 🛡️",
          Spanish: "¡Genial! Déjame configurarte ahora mismo 🛡️",
          Dutch: "Geweldig! Laat me je nu meteen instellen 🛡️",
        };
        await sendWhatsApp(`whatsapp:${phone}`, yesReplies[convLang] || yesReplies.English);

        // Alert Lee
        try {
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ To: leeNum, From: twilioFrom, Body: `🎉 ${activeInvite.contact_name} said YES to the invite! Signing them up now.` }).toString(),
          });
        } catch { /* non-fatal */ }

        // Route to signup flow
        try {
          await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/whatsapp-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
            body: JSON.stringify({ from: fromRaw, body: 'start trial' }),
          });
        } catch { /* non-fatal */ }

        return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
      }

      if (['no', 'stop', 'unsubscribe', 'leave me alone'].includes(lower)) {
        await supabase.from('proactive_invites')
          .update({ status: 'opted_out' })
          .eq('id', activeInvite.id);

        const optOutLang = detectLanguage(body);
        const optOutReplies: Record<string, string> = {
          English: "No problem at all — I won't message again. Take care 👋",
          Spanish: "Sin problema — no volveré a enviarte mensajes. ¡Cuídate! 👋",
          Dutch: "Geen probleem — ik stuur geen berichten meer. Pas goed op jezelf! 👋",
        };
        await sendWhatsApp(`whatsapp:${phone}`, optOutReplies[optOutLang] || optOutReplies.English);

        try {
          const leeNum = Deno.env.get('TWILIO_WHATSAPP_LEE')!;
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ To: leeNum, From: twilioFrom, Body: `📋 ${activeInvite.contact_name} opted out of invite.` }).toString(),
          });
        } catch { /* non-fatal */ }

        return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
      }
    }

    // ── Check for active WhatsApp signup flow ──────────────────
    const isLee = normalizedAdmin && normalizedFrom === normalizedAdmin;
    const { data: activeSignup } = await supabase
      .from('whatsapp_signups')
      .select('status')
      .eq('phone', fromRaw)
      .eq('status', 'in_progress')
      .maybeSingle();

    const signupKeywords = ['sign up','join','start','trial','free trial','get started','protect','registrar','unirse','prueba','aanmelden','probeer','gratis','interested','interesado','interesse'];
    const hasSignupIntent = signupKeywords.some(k => body.toLowerCase().includes(k));

    if (activeSignup || (hasSignupIntent && !isLee)) {
      try {
        await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/whatsapp-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
          body: JSON.stringify({ from: fromRaw, body }),
        });
      } catch (e) { console.warn('Signup forward failed:', e); }
      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Owner business mode: Lee gets assistant, not sales ─────
    const isOwner = normalizedAdmin && normalizedFrom === normalizedAdmin && bypassAdminRoute;

    if (isOwner) {
      const lowerBody = body.toLowerCase();
      const isReportRequest = /\b(report|briefing|stats|summary|how many|leads|revenue|this week|today|overnight|numbers)\b/.test(lowerBody);

      if (isReportRequest) {
        // Trigger morning briefing directly
        try {
          const { data: briefData } = await supabase.functions.invoke('clara-morning-briefing', { body: {} });
          // Briefing function sends WhatsApp to Lee directly via clara-escalation
          if (briefData?.success) {
            return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
          }
        } catch (e) {
          console.warn('Briefing invoke failed:', e);
        }
      }

      // For non-report messages: call Claude with owner context
      try {
        const ownerPrompt = `You are CLARA, the AI assistant for LifeLink Sync. You are speaking with Lee Wakeman, the OWNER and founder of LifeLink Sync.

CRITICAL: Do NOT treat Lee as a customer. Do NOT offer him a trial or sales pitch. Do NOT quote pricing to him.

You are Lee's personal business assistant. Be direct, concise, and helpful.

When he asks about the business, give him actionable insights.
When he asks about a feature, explain the technical implementation.
When he asks about stats, summarize what you know.
When he gives you an instruction, confirm and act on it.

LifeLink Sync is an emergency protection platform. Individual Plan 9.99 EUR/month, annual 99.90 EUR/year. Family seats, gifts, referral programme all active. 22 edge functions deployed, 10 cron jobs running.

Keep responses to 2-3 short paragraphs. No bullet points.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: ownerPrompt,
            messages: [{ role: 'user', content: body }],
          }),
        });

        if (!response.ok) throw new Error(`Claude ${response.status}`);
        const data = await response.json();
        let reply = stripMarkdown(data.content?.[0]?.text ?? 'Sorry, I had an issue processing that.');
        if (isVoice && voiceTranscript) {
          reply = `🎤 *Heard:* "${voiceTranscript.substring(0, 120)}"\n\n${reply}`;
        }
        await sendWhatsApp(phone, reply);
      } catch (e) {
        console.error('Owner mode Claude error:', e);
        await sendWhatsApp(phone, 'Sorry Lee, I had a technical issue. Try again or switch to /dev mode.');
      }

      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Rate limit ─────────────────────────────────────────────
    if (!checkRateLimit(phone)) {
      const entry = rateLimits.get(phone);
      if (entry && entry.count === 10) {
        entry.count++;
        const rlLang = detectLanguage(body);
        const rlReplies: Record<string, string> = {
          English: 'I want to help — please give me a moment and try again shortly.',
          Spanish: 'Quiero ayudarte — por favor dame un momento e inténtalo de nuevo en breve.',
          Dutch: 'Ik wil je graag helpen — geef me even en probeer het zo opnieuw.',
        };
        await sendWhatsApp(phone, rlReplies[rlLang] || rlReplies.English);
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

    // ── Fetch training data for knowledge base ─────────────────
    let knowledgeBase = '';
    try {
      const { data: trainingRows } = await supabase
        .from('training_data')
        .select('question, answer')
        .or('is_active.eq.true,status.eq.active')
        .limit(10);
      if (trainingRows && trainingRows.length > 0) {
        knowledgeBase = '\n\nKNOWLEDGE BASE:\n' + trainingRows.map(
          (r: { question: string; answer: string }) => `Q: ${r.question}\nA: ${r.answer}`
        ).join('\n\n');
      }
    } catch (e) { console.warn('Training data fetch failed:', e); }

    // ── Fetch conversation history ──────────────────────────────
    let conversationMessages: Array<{ role: string; content: string }> = [];
    try {
      if (existingConv?.id) {
        const { data: history } = await supabase
          .from('whatsapp_messages')
          .select('direction, content')
          .eq('conversation_id', existingConv.id)
          .order('created_at', { ascending: true })
          .limit(10);
        if (history?.length) {
          conversationMessages = history.map((h: { direction: string; content: string }) => ({
            role: h.direction === 'inbound' ? 'user' : 'assistant',
            content: h.content,
          }));
        }
      }
    } catch { /* non-fatal */ }

    // Add current message
    conversationMessages.push({ role: 'user', content: userMessage });

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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 250,
          system: SYSTEM_PROMPT + knowledgeBase,
          messages: conversationMessages,
        }),
      });

      if (!response.ok) throw new Error(`Claude ${response.status}`);
      const data = await response.json();
      aiResponse = stripMarkdown(data.content?.[0]?.text ?? '');
    } catch (aiErr) {
      console.error('Claude error:', aiErr);
      const errReplies: Record<string, string> = {
        English: 'Sorry, I am having a technical issue. Please try again in a moment.',
        Spanish: 'Lo siento, estoy teniendo un problema técnico. Por favor inténtalo de nuevo en un momento.',
        Dutch: 'Sorry, ik heb een technisch probleem. Probeer het over een moment opnieuw.',
      };
      await sendWhatsApp(phone, errReplies[detectedLang] || errReplies.English);
      return new Response(TWIML_OK, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } });
    }

    // ── Send reply (prepend voice confirmation if applicable) ──
    if (isVoice && voiceTranscript) {
      aiResponse = `🎤 *Heard:* "${voiceTranscript.substring(0, 120)}"\n\n${aiResponse}`;
    }
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
            supabase.from('whatsapp_messages').insert({ conversation_id: convId, whatsapp_message_id: messageSid, direction: 'inbound', message_type: isVoice ? 'voice' : 'text', content: body, status: 'delivered', ...(isVoice ? { metadata: { voice_transcript: voiceTranscript, media_url: mediaUrl } } : {}) }),
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
