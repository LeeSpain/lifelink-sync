// Clara Speak — TTS outbound call via Twilio
// Uses DB-based language detection, falls back to phone prefix

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getContactLanguage, getVoiceSettings, getClaraSpeakGreeting } from '../_shared/language.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c: string) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] || c));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, message, voice: voiceOverride, language: langOverride, callbackUrl } = await req.json();

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

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio not configured');
    }

    // Get language from DB, fall back to phone prefix
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const contactLang = await getContactLanguage(supabase, { phone: to });
    const vs = getVoiceSettings(contactLang);
    const greetings = getClaraSpeakGreeting(contactLang);

    const voice = voiceOverride || vs.voice;
    const language = langOverride || vs.language;

    const responseUrl = callbackUrl
      || 'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-speak-response';

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(greetings.greeting)}
  </Say>
  <Pause length="0.5"/>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(message)}
  </Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(greetings.pressPrompt)}
  </Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST" timeout="10">
    <Pause length="5"/>
  </Gather>
  <Say voice="${voice}" language="${language}">
    ${escapeXml(greetings.noResponse)}
  </Say>
</Response>`;

    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', fromNumber);
    formData.append('Twiml', twiml);
    if (callbackUrl) formData.append('StatusCallback', callbackUrl);

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
    if (!response.ok) throw new Error(result.message || 'Twilio call failed');

    console.log('clara-speak:', { to, callSid: result.sid, lang: contactLang });

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
