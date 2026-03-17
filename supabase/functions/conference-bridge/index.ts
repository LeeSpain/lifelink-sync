// Conference Bridge — connects family on a live call during SOS
// Creates a Twilio conference room and dials all emergency contacts into it
// Language adapts per participant's phone prefix

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

function getConferenceGreeting(phone: string, isMember: boolean, memberName: string) {
  const escapedName = escapeXml(memberName);
  if (phone.startsWith('+34')) {
    return isMember
      ? 'Soy CLARA de LifeLink Sync. Sus contactos de emergencia se están uniendo a una llamada con usted ahora.'
      : `CLARA de LifeLink Sync le está conectando ahora. Puente de emergencia urgente. ${escapedName} le necesita ahora.`;
  }
  if (phone.startsWith('+31')) {
    return isMember
      ? 'Dit is CLARA van LifeLink Sync. Uw noodcontacten worden nu met u verbonden.'
      : `CLARA van LifeLink Sync verbindt u nu. Dringende noodbrug. ${escapedName} heeft u nu nodig.`;
  }
  return isMember
    ? 'This is CLARA from LifeLink Sync. Your emergency contacts are joining a call with you now.'
    : `CLARA from LifeLink Sync is connecting you now. Urgent emergency bridge. ${escapedName} needs you now.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, member_name, conference_name } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const roomName = conference_name || `SOS-${user_id.slice(0, 8)}-${Date.now()}`;

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, emergency_contacts')
      .eq('user_id', user_id)
      .single();

    const contacts: Array<{ name?: string; phone?: string }> =
      (Array.isArray(profile?.emergency_contacts) ? profile.emergency_contacts : [])
        .filter((c: any) => c && c.phone)
        .slice(0, 5);

    const name = member_name || profile?.first_name || 'your family member';

    const allParticipants: Array<{ name: string; phone: string; isMember?: boolean }> = [
      ...contacts.map((c) => ({ name: c.name || 'Emergency Contact', phone: c.phone! })),
    ];

    if (profile?.phone) {
      allParticipants.push({ name, phone: profile.phone, isMember: true });
    }

    const statusCallbackUrl = `${supabaseUrl}/functions/v1/conference-status`;

    const dialResults = await Promise.allSettled(
      allParticipants.map(async (p) => {
        const isMember = (p as any).isMember === true;
        const locale = getLocale(p.phone);
        const greeting = getConferenceGreeting(p.phone, isMember, name);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${locale.voice}" language="${locale.language}">
    ${escapeXml(greeting)}
  </Say>
  <Dial>
    <Conference
      waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.soft-rock"
      startConferenceOnEnter="${isMember ? 'true' : 'false'}"
      endConferenceOnExit="${isMember ? 'true' : 'false'}"
      record="record-from-start"
      statusCallback="${statusCallbackUrl}">
      ${escapeXml(roomName)}
    </Conference>
  </Dial>
</Response>`;

        const formData = new URLSearchParams();
        formData.append('To', p.phone);
        formData.append('From', fromNumber);
        formData.append('Twiml', twiml);

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

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.message || `Dial failed for ${p.phone}`);
        return { name: p.name, callSid: result.sid, status: result.status };
      })
    );

    await supabase.from('conference_logs')
      .insert({
        user_id,
        room_name: roomName,
        participants: allParticipants.length,
        dial_results: dialResults.map((r) =>
          r.status === 'fulfilled' ? r.value : { error: String((r as PromiseRejectedResult).reason) }
        ),
        created_at: new Date().toISOString(),
      })
      .catch((e: any) => console.error('Conference log insert failed:', e));

    console.log('conference-bridge: started', { room_name: roomName, participants_dialed: allParticipants.length });

    return new Response(
      JSON.stringify({
        success: true,
        room_name: roomName,
        participants_dialed: allParticipants.length,
        dial_results: dialResults.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value),
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('conference-bridge error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
