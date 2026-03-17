// SOS Voice Alerts — calls all emergency contacts when SOS fires
// Speaks an urgent message and offers keypress response

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

    // 1. Get member's emergency contacts from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, emergency_contacts')
      .eq('user_id', user_id)
      .single();

    const contacts: Array<{ name?: string; phone?: string; email?: string; relationship?: string }> =
      Array.isArray(profile?.emergency_contacts) ? profile.emergency_contacts : [];

    const activeContacts = contacts.filter((c) => c && c.phone);

    if (activeContacts.length === 0) {
      console.warn('sos-voice-alerts: no emergency contacts with phones for', user_id);
      return new Response(
        JSON.stringify({ success: false, error: 'No emergency contacts with phone numbers found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Build the spoken message
    const name = member_name || profile?.first_name || 'Your family member';
    const locationText = location_address
      ? `Their last known location is ${escapeXml(location_address)}.`
      : location_lat
        ? `Their GPS coordinates have been shared with you.`
        : `Location is being determined.`;

    const spokenMessage = `Urgent message from CLARA at LifeLink Sync. ${escapeXml(name)} has triggered an emergency SOS alert. ${locationText} Please check on them immediately or call 1 1 2 if you believe this is a life threatening emergency. This message is from CLARA, the LifeLink Sync emergency protection system.`;

    const responseUrl = `${supabaseUrl}/functions/v1/clara-speak-response`;

    // 3. Call each contact in parallel
    const callResults = await Promise.allSettled(
      activeContacts.map(async (contact) => {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    ${spokenMessage}
  </Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna" language="en-GB">
    Press 1 to confirm you have received this alert.
  </Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST">
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
        if (!response.ok) {
          throw new Error(result.message || `Call to ${contact.phone} failed`);
        }
        return {
          contact: contact.name || contact.phone,
          phone: contact.phone,
          callSid: result.sid,
          status: result.status,
        };
      })
    );

    // 4. Also call the member back (CLARA checks they are okay)
    let memberCallResult = null;
    const memberPhone = profile?.phone;
    if (memberPhone) {
      const memberTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    This is CLARA from LifeLink Sync. Your emergency alert has been triggered. Your family is being contacted now. Press 1 if you are safe and this was an accident. Press 2 if you need emergency services. If you do not respond, emergency services will be alerted.
  </Say>
  <Gather numDigits="1" action="${responseUrl}" method="POST">
    <Pause length="10"/>
  </Gather>
  <Say voice="Polly.Joanna" language="en-GB">
    No response detected. Your emergency contacts are being alerted now. Please call 1 1 2 if you need immediate help.
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

    // 5. Log the voice alerts
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

    console.log('sos-voice-alerts: completed', {
      contacts_called: activeContacts.length,
      member_called: !!memberCallResult?.sid,
    });

    return new Response(
      JSON.stringify({
        success: true,
        contacts_called: activeContacts.length,
        call_results: callResults
          .filter((r) => r.status === 'fulfilled')
          .map((r) => (r as PromiseFulfilledResult<any>).value),
        member_called: !!memberPhone,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('sos-voice-alerts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
