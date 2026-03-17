// Clara Speak — TTS outbound call via Twilio
// Makes CLARA call a phone number and speak a message using Twilio TTS
// Detects country from phone prefix for language/voice selection

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c: string) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] || c));
}

function getLocale(phone: string) {
  if (phone.startsWith('+34')) return { voice: 'Polly.Conchita', language: 'es-ES', greeting: 'Hola. Soy CLARA, tu asistente de seguridad personal de LifeLink Sync.', noResponse: 'No se ha recibido respuesta. Se está alertando a sus contactos de emergencia.', pressPrompt: 'Pulse 1 para confirmar que está bien. Pulse 2 para activar respuesta de emergencia.' };
  if (phone.startsWith('+31')) return { voice: 'Polly.Lotte', language: 'nl-NL', greeting: 'Hallo. Ik ben CLARA, uw persoonlijke veiligheidsassistent van LifeLink Sync.', noResponse: 'Geen reactie ontvangen. Uw noodcontacten worden nu gewaarschuwd.', pressPrompt: 'Druk 1 om te bevestigen dat u veilig bent. Druk 2 voor noodhulp.' };
  return { voice: 'Polly.Joanna', language: 'en-GB', greeting: 'Hello. This is CLARA, your personal safety assistant from LifeLink Sync.', noResponse: 'No response received. Alerting your emergency contacts now.', pressPrompt: 'Press 1 to confirm you are safe. Press 2 to trigger emergency response.' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      to,
      message,
      voice: voiceOverride,
      language: langOverride,
      callbackUrl,
    } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'to and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
      || Deno.env.get('TWILIO_WHATSAPP_FROM')?.replace('whatsapp:', '');

    if (!accountSid || !authToken) {
      throw new Error('Twilio not configured');
    }
    if (!fromNumber) {
      throw new Error('No Twilio phone number configured');
    }

    const locale = getLocale(to);
    const voice = voiceOverride || locale.voice;
    const language = langOverride || locale.language;

    const responseUrl = callbackUrl
      || 'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-speak-response';

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(locale.greeting)}
  </Say>
  <Pause length="0.5"/>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(message)}
  </Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(locale.pressPrompt)}
  </Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST" timeout="10">
    <Pause length="5"/>
  </Gather>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(locale.noResponse)}
  </Say>
</Response>`;

    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', fromNumber);
    formData.append('Twiml', twiml);
    if (callbackUrl) {
      formData.append('StatusCallback', callbackUrl);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Twilio call failed');
    }

    console.log('clara-speak: call initiated', { to, callSid: result.sid, language });

    return new Response(
      JSON.stringify({ success: true, callSid: result.sid, status: result.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('clara-speak error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
