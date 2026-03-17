// Clara Wellbeing Call — daily check-in and medication reminders via voice
// Uses DB-based language per member, falls back to phone prefix

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getContactLanguage, getVoiceSettings, getWellbeingScripts } from '../_shared/language.ts';

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

    if (!accountSid || !authToken || !fromNumber) throw new Error('Twilio credentials not configured');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const lang = await getContactLanguage(supabase, { userId: user_id, phone: member_phone });
    const vs = getVoiceSettings(lang);
    const scripts = getWellbeingScripts(lang, escapeXml(member_name || 'there'));
    const isWellbeing = check_type === 'wellbeing';

    const responseUrl = `https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/clara-speak-response?user_id=${encodeURIComponent(user_id || '')}`;

    let twiml: string;
    if (isWellbeing) {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${vs.voice}" language="${vs.language}">${scripts.wellbeingGreeting}</Say>
  <Pause length="1"/>
  <Say voice="${vs.voice}" language="${vs.language}">${scripts.wellbeingQuestion}</Say>
  <Gather numDigits="1" action="${responseUrl}&amp;question=mood" method="POST" timeout="10">
    <Pause length="8"/>
  </Gather>
  <Say voice="${vs.voice}" language="${vs.language}">${scripts.wellbeingNoResponse}</Say>
</Response>`;
    } else {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${vs.voice}" language="${vs.language}">${scripts.medicationPrompt}</Say>
  <Gather numDigits="1" action="${responseUrl}&amp;question=medication" method="POST" timeout="10">
    <Pause length="8"/>
  </Gather>
  <Say voice="${vs.voice}" language="${vs.language}">${scripts.medicationNoResponse}</Say>
</Response>`;
    }

    const formData = new URLSearchParams();
    formData.append('To', member_phone);
    formData.append('From', fromNumber);
    formData.append('Twiml', twiml);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      { method: 'POST', headers: { 'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`), 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Twilio call failed');

    console.log('clara-wellbeing-call:', { check_type: check_type || 'wellbeing', to: member_phone, callSid: result.sid, lang });

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
