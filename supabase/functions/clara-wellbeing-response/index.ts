// Clara Wellbeing Response — handles keypress from wellbeing/medication calls
// Stores data in wellbeing_responses and notifies family if needed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Content-Type': 'text/xml' } });
  }

  try {
    const body = await req.formData();
    const digit = body.get('Digits') as string | null;
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const question = url.searchParams.get('question');

    console.log('clara-wellbeing-response:', { digit, userId, question });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the response
    if (userId) {
      await supabase
        .from('wellbeing_responses')
        .insert({
          user_id: userId,
          question_type: question || 'unknown',
          response_value: parseInt(digit || '0'),
          responded_at: new Date().toISOString(),
          channel: 'voice',
        })
        .catch((e: any) => console.error('Wellbeing response insert failed:', e));
    }

    // Determine if family alert is needed
    const needsAlert =
      (question === 'mood' && parseInt(digit || '3') >= 4) ||
      (question === 'medication' && digit === '2') ||
      digit === null;

    // Build spoken response
    let twimlResponse = 'Thank you for your response.';

    if (question === 'mood') {
      const responses: Record<string, string> = {
        '1': 'Wonderful! I am glad to hear you are doing well today.',
        '2': 'Good to hear you are feeling good.',
        '3': 'Thank you. I hope your day improves.',
        '4': 'I am sorry to hear that. Your family will be updated.',
        '5': 'I am concerned about how you are feeling. Your family will be notified right away.',
      };
      twimlResponse = responses[digit || ''] || 'Thank you for your response.';
    } else if (question === 'medication') {
      twimlResponse = digit === '1'
        ? 'Excellent! Well done for taking your medication. Have a great day.'
        : 'No problem. Please remember to take it when you can. Your family will be updated.';
    }

    // Notify family via WhatsApp if alert needed
    if (needsAlert && userId) {
      try {
        // Get member name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, emergency_contacts')
          .eq('user_id', userId)
          .single();

        const memberName = profile?.first_name || 'Your family member';
        const contacts: Array<{ phone?: string; name?: string }> =
          Array.isArray(profile?.emergency_contacts) ? profile.emergency_contacts : [];

        // Build alert message
        let alertMsg = '';
        if (question === 'mood' && digit) {
          const moodLevel = parseInt(digit);
          alertMsg = moodLevel >= 5
            ? `${memberName} reported feeling unwell (${digit}/5) during their CLARA check-in. Please check on them.`
            : `${memberName} reported feeling not great (${digit}/5) during their CLARA check-in.`;
        } else if (question === 'medication' && digit === '2') {
          alertMsg = `${memberName} has not yet taken their medication today. Gentle reminder may help.`;
        } else if (!digit) {
          alertMsg = `${memberName} did not respond to their CLARA ${question || 'wellbeing'} check-in. Please check on them.`;
        }

        // Send WhatsApp alerts to emergency contacts with phones
        if (alertMsg) {
          const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
          const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
          const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

          for (const contact of contacts.filter((c) => c.phone)) {
            const whatsappTo = contact.phone!.startsWith('whatsapp:')
              ? contact.phone!
              : `whatsapp:${contact.phone!.replace(/\s/g, '')}`;

            await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  To: whatsappTo,
                  From: twilioFrom,
                  Body: alertMsg,
                }).toString(),
              }
            ).catch((e) => console.error('WhatsApp alert failed for', contact.phone, e));
          }
        }
      } catch (e) {
        console.error('Family notification failed:', e);
      }
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    ${twimlResponse} Stay safe. Goodbye.
  </Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('clara-wellbeing-response error:', error);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">
    Thank you for your time. Stay safe. Goodbye.
  </Say>
  <Hangup/>
</Response>`;
    return new Response(fallbackTwiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
