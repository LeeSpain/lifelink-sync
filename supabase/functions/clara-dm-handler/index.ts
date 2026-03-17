import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const leePhone = Deno.env.get('TWILIO_WHATSAPP_LEE')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
  });
};

const DM_TEMPLATES: Record<string, Record<string, string>> = {
  interested: {
    en: `Hi! Thanks for reaching out! LifeLink Sync is a personal emergency protection platform — a one-tap SOS button that instantly alerts your chosen contacts if something happens.\n\nIt's designed for people living independently, families worried about elderly parents, and lone workers.\n\n7-day free trial, no card needed. Takes 2 minutes:\nhttps://lifelink-sync.com\n\nAny questions — just ask! I'm CLARA from the LifeLink Sync team.`,
    es: `Hola! Gracias por contactarnos! LifeLink Sync es una plataforma de proteccion de emergencias — un boton SOS que alerta instantaneamente a tus contactos elegidos.\n\nPrueba gratuita de 7 dias, sin tarjeta:\nhttps://lifelink-sync.com\n\nSoy CLARA del equipo de LifeLink Sync.`,
    nl: `Hallo! Bedankt voor je bericht! LifeLink Sync is een noodbeschermingsplatform — een SOS-knop die direct je gekozen contacten waarschuwt.\n\n7 dagen gratis, geen creditcard nodig:\nhttps://lifelink-sync.com\n\nIk ben CLARA van het LifeLink Sync team.`,
  },
  pricing: {
    en: `Great question! LifeLink Sync is €9.99/month or €99.90/year (2 months free).\n\nThat covers:\n- Personal SOS button\n- Up to 5 emergency contacts\n- 24/7 CLARA AI support\n- Real-time location sharing\n\n7-day free trial, no card needed:\nhttps://lifelink-sync.com\n\n— CLARA`,
    es: `Buena pregunta! LifeLink Sync cuesta 9,99 EUR/mes o 99,90 EUR/ano (2 meses gratis).\n\nPrueba gratuita de 7 dias sin tarjeta:\nhttps://lifelink-sync.com\n\n— CLARA`,
    nl: `Goede vraag! LifeLink Sync kost €9,99/maand of €99,90/jaar (2 maanden gratis).\n\n7 dagen gratis, geen creditcard:\nhttps://lifelink-sync.com\n\n— CLARA`,
  },
};

async function classifyDM(text: string): Promise<{ category: string; language: string; urgency: string; who_for: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: `Classify this DM for LifeLink Sync:\nMessage: "${text}"\n\nCategories: interested, pricing, support, complaint, spam, other\nAlso extract: language (en/es/nl/other), urgency (low/medium/high), who_for (self/mum/dad/other/unknown)\n\nRespond JSON only:\n{"category":"...","language":"...","urgency":"...","who_for":"..."}` }],
    }),
  });
  const data = await res.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());
}

serve(async (req) => {
  try {
    // Webhook verification for Meta
    const url = new URL(req.url);
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
        return new Response(challenge, { status: 200 });
      }
      return new Response('Forbidden', { status: 403 });
    }

    const body = await req.json();

    // Handle internal action calls
    if (body.action === 'handle_dm') {
      const { platform, sender_id, message_text, sender_name } = body;
      const classification = await classifyDM(message_text);

      // Log DM
      await supabase.from('whatsapp_conversations').insert({
        phone_number: sender_id,
        contact_name: sender_name || null,
        status: 'active',
        metadata: { source: `${platform}_dm`, classification },
      }).select('id').single();

      let responseText = '';

      if (classification.category === 'interested' || classification.category === 'pricing') {
        const lang = ['en', 'es', 'nl'].includes(classification.language) ? classification.language : 'en';
        responseText = DM_TEMPLATES[classification.category]?.[lang] || DM_TEMPLATES[classification.category]?.en || '';
      } else if (classification.category === 'support') {
        const supportReplies: Record<string, string> = {
          en: "Thanks for reaching out! I'm CLARA from LifeLink Sync. I'd love to help. Could you share your name and email so I can look into this for you?",
          es: "¡Gracias por contactarnos! Soy CLARA de LifeLink Sync. Me encantaría ayudarte. ¿Podrías compartir tu nombre y correo electrónico para investigar esto?",
          nl: "Bedankt voor je bericht! Ik ben CLARA van LifeLink Sync. Ik help je graag. Kun je je naam en e-mailadres delen zodat ik dit kan onderzoeken?",
        };
        responseText = supportReplies[classification.language] || supportReplies.en;
        await sendWhatsApp(leePhone, `📱 Support DM on ${platform}:\n"${message_text.substring(0, 100)}"\nFrom: ${sender_name || sender_id}`);
      } else if (classification.category === 'complaint') {
        const complaintReplies: Record<string, string> = {
          en: "I'm really sorry to hear that. I completely understand your frustration and I'm flagging this to Lee, our founder, right now. You'll hear back very shortly.",
          es: "Lamento mucho escuchar eso. Entiendo completamente tu frustración y estoy enviando esto a Lee, nuestro fundador, ahora mismo. Tendrás noticias muy pronto.",
          nl: "Het spijt me dat te horen. Ik begrijp je frustratie volledig en ik stuur dit nu door naar Lee, onze oprichter. Je hoort heel snel van ons.",
        };
        responseText = complaintReplies[classification.language] || complaintReplies.en;
        await sendWhatsApp(leePhone, `⚠️ COMPLAINT DM on ${platform}:\n"${message_text.substring(0, 200)}"\nFrom: ${sender_name || sender_id}\nUrgency: ${classification.urgency}`);
      } else if (classification.category === 'spam') {
        // No response, just log
        return new Response(JSON.stringify({ success: true, action: 'ignored_spam' }), { status: 200 });
      } else {
        // Use Claude for custom response
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            system: 'You are CLARA from LifeLink Sync. Respond to this social media DM warmly and concisely. Direct them to https://lifelink-sync.com if relevant.',
            messages: [{ role: 'user', content: message_text }],
          }),
        });
        const aiData = await aiRes.json();
        responseText = aiData.content?.[0]?.text || '';
      }

      // Write response command to Riven bridge
      if (responseText) {
        await supabase.from('clara_riven_commands').insert({
          command_type: 'dm_response',
          command_data: { platform, sender_id, response: responseText, original: message_text },
          priority: classification.urgency === 'high' ? 1 : 3,
        });
      }

      return new Response(JSON.stringify({ success: true, category: classification.category }), { status: 200 });
    }

    // Handle Meta webhook payload
    const entry = body.entry?.[0];
    if (entry) {
      const messaging = entry.messaging?.[0] || entry.changes?.[0]?.value?.messages?.[0];
      if (messaging?.message?.text) {
        await supabase.from('clara_riven_commands').insert({
          command_type: 'dm_response',
          command_data: {
            platform: body.object || 'instagram',
            sender_id: messaging.sender?.id || messaging.from,
            message_text: messaging.message.text,
            timestamp: messaging.timestamp,
          },
          priority: 2,
        });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('clara-dm-handler error:', error);
    return new Response('OK', { status: 200 });
  }
});
