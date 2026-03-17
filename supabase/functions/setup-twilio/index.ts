// Setup Twilio — one-time configuration of Twilio phone number
// Sets friendly name to "CLARA - LifeLink Sync" and configures voice URL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TWILIO_PHONE_NUMBER secret is not set. Please purchase a Twilio voice number and set it.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const auth = btoa(`${accountSid}:${authToken}`);

    // 1. Get the phone number SID
    const listResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`,
      {
        headers: { 'Authorization': `Basic ${auth}` },
      }
    );

    const listData = await listResp.json();
    const numberRecord = listData.incoming_phone_numbers?.[0];

    if (!numberRecord) {
      // List all available numbers for debugging
      const allResp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
        {
          headers: { 'Authorization': `Basic ${auth}` },
        }
      );
      const allData = await allResp.json();

      return new Response(
        JSON.stringify({
          success: false,
          error: `Phone number ${phoneNumber} not found in Twilio account`,
          available_numbers: allData.incoming_phone_numbers?.map((n: any) => ({
            phone: n.phone_number,
            friendly_name: n.friendly_name,
            capabilities: n.capabilities,
          })) || [],
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update friendly name and voice URL
    const updateForm = new URLSearchParams();
    updateForm.append('FriendlyName', 'CLARA - LifeLink Sync');
    updateForm.append('VoiceUrl', `${supabaseUrl}/functions/v1/clara-speak-response`);
    updateForm.append('VoiceMethod', 'POST');

    const updateResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${numberRecord.sid}.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: updateForm.toString(),
      }
    );

    const updateData = await updateResp.json();

    if (!updateResp.ok) {
      throw new Error(updateData.message || 'Failed to update Twilio number');
    }

    console.log('setup-twilio: number configured', {
      number: phoneNumber,
      friendly_name: updateData.friendly_name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        number: phoneNumber,
        sid: numberRecord.sid,
        friendly_name: updateData.friendly_name,
        voice_url: updateData.voice_url,
        capabilities: numberRecord.capabilities,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('setup-twilio error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
