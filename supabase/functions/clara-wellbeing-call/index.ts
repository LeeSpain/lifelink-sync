// Clara Wellbeing Call — daily check-in and medication reminders via voice
// CLARA calls the member in their language (ES/NL/EN) based on phone prefix

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
  if (phone.startsWith('+34')) return { voice: 'Polly.Conchita', language: 'es-ES' };
  if (phone.startsWith('+31')) return { voice: 'Polly.Lotte', language: 'nl-NL' };
  return { voice: 'Polly.Joanna', language: 'en-GB' };
}

function getWellbeingScript(phone: string, name: string) {
  const n = escapeXml(name);
  if (phone.startsWith('+34')) return {
    greeting: `Hola ${n}, soy CLARA de LifeLink Sync con tu revisión diaria de bienestar.`,
    question: `¿Cómo te encuentras hoy en general? Pulsa 1 para muy bien, 2 para bien, 3 para regular, 4 para no muy bien, o 5 para mal.`,
    noResponse: `No he recibido tu respuesta. Se notificará a tu familia de la revisión perdida. Cuídate, adiós.`,
  };
  if (phone.startsWith('+31')) return {
    greeting: `Hallo ${n}, ik ben CLARA van LifeLink Sync met uw dagelijkse welzijnscontrole.`,
    question: `Hoe voelt u zich vandaag? Druk 1 voor heel goed, 2 voor goed, 3 voor oké, 4 voor niet zo goed, of 5 voor slecht.`,
    noResponse: `Ik heb geen reactie ontvangen. Uw familie wordt op de hoogte gebracht. Pas goed op uzelf, tot ziens.`,
  };
  return {
    greeting: `Hello ${n}, this is CLARA, your LifeLink Sync assistant, with your daily wellbeing check-in.`,
    question: `How are you feeling today overall? Press 1 for very well, 2 for good, 3 for okay, 4 for not great, or 5 for unwell.`,
    noResponse: `I did not catch your response. Your family will be notified of the missed check-in. Take care, goodbye.`,
  };
}

function getMedicationScript(phone: string, name: string) {
  const n = escapeXml(name);
  if (phone.startsWith('+34')) return {
    prompt: `Hola ${n}, soy CLARA con tu recordatorio de medicación. ¿Has tomado tu medicación hoy? Pulsa 1 para sí, o 2 para todavía no.`,
    noResponse: `No se ha recibido respuesta. Se notificará a tu familia. Cuídate, adiós.`,
  };
  if (phone.startsWith('+31')) return {
    prompt: `Hallo ${n}, ik ben CLARA met uw medicatieherinnering. Heeft u vandaag uw medicatie ingenomen? Druk 1 voor ja, of 2 voor nog niet.`,
    noResponse: `Geen reactie ontvangen. Uw familie wordt op de hoogte gebracht. Pas goed op uzelf, tot ziens.`,
  };
  return {
    prompt: `Hello ${n}, this is CLARA, your LifeLink Sync assistant, with your medication reminder. Have you taken your medication today? Press 1 for yes, or 2 for not yet.`,
    noResponse: `No response received. Your family will be notified. Take care, goodbye.`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, member_phone, member_name, check_type } = await req.json();

    if (!member_phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'member_phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
      || Deno.env.get('TWILIO_WHATSAPP_FROM')?.replace('whatsapp:', '');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const locale = getLocale(member_phone);
    const isWellbeing = check_type === 'wellbeing';
    const nameOrDefault = member_name || 'there';

    const responseUrl = `https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-speak-response?user_id=${encodeURIComponent(user_id || '')}`;

    let twiml: string;

    if (isWellbeing) {
      const script = getWellbeingScript(member_phone, nameOrDefault);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${script.greeting}
  </Say>
  <Pause length="1"/>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${script.question}
  </Say>
  <Gather numDigits="1" action="${responseUrl}&amp;question=mood" method="POST" timeout="10">
    <Pause length="8"/>
  </Gather>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${script.noResponse}
  </Say>
</Response>`;
    } else {
      const script = getMedicationScript(member_phone, nameOrDefault);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${script.prompt}
  </Say>
  <Gather numDigits="1" action="${responseUrl}&amp;question=medication" method="POST" timeout="10">
    <Pause length="8"/>
  </Gather>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${script.noResponse}
  </Say>
</Response>`;
    }

    const formData = new URLSearchParams();
    formData.append('To', member_phone);
    formData.append('From', fromNumber);
    formData.append('Twiml', twiml);

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

    console.log('clara-wellbeing-call:', { check_type: check_type || 'wellbeing', to: member_phone, callSid: result.sid, language: locale.language });

    return new Response(
      JSON.stringify({ success: true, callSid: result.sid, status: result.status }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('clara-wellbeing-call error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
