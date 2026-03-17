// SOS Voice Alerts — calls all emergency contacts when SOS fires
// Speaks an urgent message in the contact's language and offers keypress response

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function getEmergencyMessage(phone: string, name: string, locationText: string) {
  const escapedName = escapeXml(name);
  if (phone.startsWith('+34')) {
    const locEs = locationText
      ? `Su última ubicación conocida es ${escapeXml(locationText)}.`
      : `Se está determinando su ubicación.`;
    return `Mensaje urgente de CLARA en LifeLink Sync. ${escapedName} ha activado una alerta de emergencia. ${locEs} Por favor contáctele inmediatamente o llame al 1 1 2 si cree que es una emergencia grave. Este mensaje es de CLARA, el sistema de protección de emergencias de LifeLink Sync.`;
  }
  if (phone.startsWith('+31')) {
    const locNl = locationText
      ? `De laatst bekende locatie is ${escapeXml(locationText)}.`
      : `De locatie wordt bepaald.`;
    return `Dringend bericht van CLARA bij LifeLink Sync. ${escapedName} heeft een nood SOS alarm geactiveerd. ${locNl} Neem onmiddellijk contact op of bel 1 1 2 als u denkt dat het een levensbedreigende noodsituatie is.`;
  }
  const locEn = locationText
    ? `Their last known location is ${escapeXml(locationText)}.`
    : `Location is being determined.`;
  return `Urgent message from CLARA at LifeLink Sync. ${escapedName} has triggered an emergency SOS alert. ${locEn} Please check on them immediately or call 1 1 2 if you believe this is a life threatening emergency. This message is from CLARA, the LifeLink Sync emergency protection system.`;
}

function getConfirmPrompt(phone: string) {
  if (phone.startsWith('+34')) return 'Pulse 1 para confirmar que ha recibido esta alerta.';
  if (phone.startsWith('+31')) return 'Druk 1 om te bevestigen dat u dit alarm heeft ontvangen.';
  return 'Press 1 to confirm you have received this alert.';
}

function getMemberMessage(phone: string) {
  if (phone.startsWith('+34')) return 'Soy CLARA de LifeLink Sync. Su alerta de emergencia ha sido activada. Se está contactando a su familia ahora. Pulse 1 si está a salvo y fue un accidente. Pulse 2 si necesita servicios de emergencia. Si no responde, se alertará a los servicios de emergencia.';
  if (phone.startsWith('+31')) return 'Dit is CLARA van LifeLink Sync. Uw noodalarm is geactiveerd. Uw familie wordt nu gecontacteerd. Druk 1 als u veilig bent en het een ongeluk was. Druk 2 als u hulpdiensten nodig heeft.';
  return 'This is CLARA from LifeLink Sync. Your emergency alert has been triggered. Your family is being contacted now. Press 1 if you are safe and this was an accident. Press 2 if you need emergency services. If you do not respond, emergency services will be alerted.';
}

function getMemberNoResponse(phone: string) {
  if (phone.startsWith('+34')) return 'No se ha detectado respuesta. Se está alertando a sus contactos de emergencia. Por favor llame al 1 1 2 si necesita ayuda inmediata.';
  if (phone.startsWith('+31')) return 'Geen reactie gedetecteerd. Uw noodcontacten worden gewaarschuwd. Bel 1 1 2 als u onmiddellijk hulp nodig heeft.';
  return 'No response detected. Your emergency contacts are being alerted now. Please call 1 1 2 if you need immediate help.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      member_name,
      location_lat,
      location_lng,
      location_address,
      trigger_type,
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
      || Deno.env.get('TWILIO_WHATSAPP_FROM')?.replace('whatsapp:', '');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, emergency_contacts')
      .eq('user_id', user_id)
      .single();

    const contacts: Array<{ name?: string; phone?: string; email?: string }> =
      Array.isArray(profile?.emergency_contacts) ? profile.emergency_contacts : [];
    const activeContacts = contacts.filter((c) => c && c.phone);

    if (activeContacts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No emergency contacts with phone numbers found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const name = member_name || profile?.first_name || 'Your family member';
    const responseUrl = 'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-speak-response';

    // Call each contact in parallel — language adapts per contact's phone prefix
    const callResults = await Promise.allSettled(
      activeContacts.map(async (contact) => {
        const locale = getLocale(contact.phone!);
        const spokenMessage = getEmergencyMessage(contact.phone!, name, location_address || '');
        const confirmPrompt = getConfirmPrompt(contact.phone!);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${spokenMessage}
  </Say>
  <Pause length="2"/>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${confirmPrompt}
  </Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST" timeout="10">
    <Pause length="5"/>
  </Gather>
</Response>`;

        const formData = new URLSearchParams();
        formData.append('To', contact.phone!);
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
        if (!response.ok) throw new Error(result.message || `Call to ${contact.phone} failed`);
        return { contact: contact.name || contact.phone, phone: contact.phone, callSid: result.sid, status: result.status };
      })
    );

    // Call the member back — language adapts to member's phone
    let memberCallResult = null;
    const memberPhone = profile?.phone;
    if (memberPhone) {
      const mLocale = getLocale(memberPhone);
      const memberMsg = getMemberMessage(memberPhone);
      const memberNoResp = getMemberNoResponse(memberPhone);

      const memberTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${mLocale.voice}" language="${mLocale.language}">
    ${memberMsg}
  </Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST" timeout="10">
    <Pause length="10"/>
  </Gather>
  <Say voice="${mLocale.voice}" language="${mLocale.language}">
    ${memberNoResp}
  </Say>
</Response>`;

      try {
        const formData = new URLSearchParams();
        formData.append('To', memberPhone);
        formData.append('From', fromNumber);
        formData.append('Twiml', memberTwiml);

        const resp = await fetch(
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
        memberCallResult = await resp.json();
      } catch (e) {
        console.error('Failed to call member back:', e);
      }
    }

    // Log
    await supabase.from('voice_alert_logs')
      .insert({
        user_id,
        trigger_type: trigger_type || 'sos',
        contacts_called: activeContacts.length,
        call_results: callResults.map((r) =>
          r.status === 'fulfilled' ? r.value : { error: String((r as PromiseRejectedResult).reason) }
        ),
        member_called: !!memberCallResult?.sid,
        member_call_sid: memberCallResult?.sid || null,
        created_at: new Date().toISOString(),
      })
      .catch((e: any) => console.error('Voice alert log insert failed:', e));

    console.log('sos-voice-alerts: completed', { contacts_called: activeContacts.length, member_called: !!memberCallResult?.sid });

    return new Response(
      JSON.stringify({
        success: true,
        contacts_called: activeContacts.length,
        call_results: callResults.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value),
        member_called: !!memberPhone,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('sos-voice-alerts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
