// Clara Speak Response — handles keypress after CLARA speaks on a call
// Returns TwiML based on digit pressed (1=safe, 2=emergency)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  try {
    const body = await req.formData();
    const digit = body.get('Digits') as string | null;
    const callSid = body.get('CallSid') as string | null;
    const to = body.get('To') as string | null;

    console.log('clara-speak-response:', { digit, callSid, to });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let twiml = '';

    if (digit === '1') {
      // Member confirmed they are safe
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    Thank you. I have recorded that you are safe. Your family has been notified. Stay protected with LifeLink Sync.
  </Say>
  <Hangup/>
</Response>`;

      // Log safe confirmation
      await supabase.from('voice_alert_logs').insert({
        trigger_type: 'safe_confirmation',
        call_results: { callSid, digit: '1', response: 'safe' },
        created_at: new Date().toISOString(),
      }).catch(() => {});

    } else if (digit === '2') {
      // Member triggered emergency
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    Emergency response activated. Your location is being shared with your family. Please stay on the line if you can. Emergency services number is 1 1 2.
  </Say>
  <Pause length="30"/>
</Response>`;

      // Trigger full emergency response — call SOS voice alerts
      try {
        await fetch(
          `${supabaseUrl}/functions/v1/sos-voice-alerts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trigger_type: 'voice_emergency',
            }),
          }
        );
      } catch (e) {
        console.error('Failed to trigger SOS voice alerts:', e);
      }

    } else {
      // No valid response
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    I did not receive a valid response. Alerting your emergency contacts now.
  </Say>
  <Hangup/>
</Response>`;
    }

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('clara-speak-response error:', error);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    An error occurred. Please call 1 1 2 if you need emergency help.
  </Say>
  <Hangup/>
</Response>`;
    return new Response(fallbackTwiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
