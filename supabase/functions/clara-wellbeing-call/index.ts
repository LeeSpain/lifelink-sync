// Clara Wellbeing Call — daily check-in and medication reminders via voice
// CLARA calls the member and asks wellbeing/medication questions

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      member_phone,
      member_name,
      check_type,
    } = await req.json();

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const escapedName = escapeXml(member_name || 'there');
    const isWellbeing = check_type === 'wellbeing';

    const responseUrl = `${supabaseUrl}/functions/v1/clara-wellbeing-response?user_id=${encodeURIComponent(user_id || '')}`;

    const twiml = isWellbeing
      ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    Hello ${escapedName}, this is CLARA from LifeLink Sync with your daily wellbeing check-in.
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna" language="en-GB">
    How are you feeling today overall? Press 1 for very well, 2 for good, 3 for okay, 4 for not great, or 5 for unwell.
  </Say>
  <Gather numDigits="1" action="${responseUrl}&amp;question=mood" method="POST">
    <Pause length="8"/>
  </Gather>
  <Say voice="Polly.Joanna" language="en-GB">
    I did not catch your response. Your family will be notified of the missed check-in. Take care, goodbye.
  </Say>
</Response>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    Hello ${escapedName}, this is CLARA with your medication reminder. Have you taken your medication today? Press 1 for yes, or 2 for not yet.
  </Say>
  <Gather numDigits="1" action="${responseUrl}&amp;question=medication" method="POST">
    <Pause length="8"/>
  </Gather>
  <Say voice="Polly.Joanna" language="en-GB">
    No response received. Your family will be notified. Take care, goodbye.
  </Say>
</Response>`;

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

    console.log('clara-wellbeing-call:', {
      check_type: check_type || 'wellbeing',
      to: member_phone,
      callSid: result.sid,
    });

    return new Response(
      JSON.stringify({
        success: true,
        callSid: result.sid,
        status: result.status,
      }),
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
