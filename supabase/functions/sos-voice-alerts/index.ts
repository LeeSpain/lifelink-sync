// SOS Voice Alerts — calls all emergency contacts when SOS fires
// Uses DB-based language per contact, falls back to phone prefix

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getContactLanguage, getVoiceSettings, getEmergencyMessages } from '../_shared/language.ts';

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
    const { user_id, member_name, location_lat, location_lng, location_address, trigger_type } = await req.json();

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
      || Deno.env.get('TWILIO_WHATSAPP_FROM')?.replace('whatsapp:', '');

    if (!accountSid || !authToken || !fromNumber) throw new Error('Twilio credentials not configured');

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

    // Call each contact — language from DB per contact
    const callResults = await Promise.allSettled(
      activeContacts.map(async (contact) => {
        const lang = await getContactLanguage(supabase, { phone: contact.phone });
        const vs = getVoiceSettings(lang);
        const msgs = getEmergencyMessages(lang, escapeXml(name), location_address || '');

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${vs.voice}" language="${vs.language}">${msgs.contactAlert}</Say>
  <Pause length="2"/>
  <Say voice="${vs.voice}" language="${vs.language}">${msgs.confirmPrompt}</Say>
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
          { method: 'POST', headers: { 'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`), 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Call to ${contact.phone} failed`);
        return { contact: contact.name || contact.phone, phone: contact.phone, callSid: result.sid, status: result.status, lang };
      })
    );

    // Call member back
    let memberCallResult = null;
    const memberPhone = profile?.phone;
    if (memberPhone) {
      const mLang = await getContactLanguage(supabase, { userId: user_id, phone: memberPhone });
      const mVs = getVoiceSettings(mLang);
      const mMsgs = getEmergencyMessages(mLang, name, '');

      const memberTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${mVs.voice}" language="${mVs.language}">${mMsgs.memberCheck}</Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST" timeout="10">
    <Pause length="10"/>
  </Gather>
  <Say voice="${mVs.voice}" language="${mVs.language}">${mMsgs.noResponse}</Say>
</Response>`;

      try {
        const formData = new URLSearchParams();
        formData.append('To', memberPhone);
        formData.append('From', fromNumber);
        formData.append('Twiml', memberTwiml);
        const resp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
          { method: 'POST', headers: { 'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`), 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() }
        );
        memberCallResult = await resp.json();
      } catch (e) { console.error('Failed to call member back:', e); }
    }

    await supabase.from('voice_alert_logs').insert({
      user_id,
      trigger_type: trigger_type || 'sos',
      contacts_called: activeContacts.length,
      call_results: callResults.map((r) => r.status === 'fulfilled' ? r.value : { error: String((r as PromiseRejectedResult).reason) }),
      member_called: !!memberCallResult?.sid,
      member_call_sid: memberCallResult?.sid || null,
      created_at: new Date().toISOString(),
    }).catch((e: any) => console.error('Voice alert log insert failed:', e));

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
