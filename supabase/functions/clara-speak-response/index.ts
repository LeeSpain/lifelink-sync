// Clara Speak Response — handles keypress after CLARA speaks on a call
// Returns TwiML based on digit pressed (1=safe, 2=emergency)
// CRITICAL: Twilio calls this without JWT — must be deployed with --no-verify-jwt
// CRITICAL: Must ALWAYS return Content-Type: text/xml with valid TwiML

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Twilio sends POST with application/x-www-form-urlencoded
  // Must return Content-Type: text/xml with valid TwiML on ALL paths

  try {
    // Parse Twilio's URL-encoded form body reliably
    let digit = '';
    let callSid = '';
    let calledNumber = '';

    try {
      const text = await req.text();
      const params = new URLSearchParams(text);
      digit = params.get('Digits') || params.get('SpeechResult') || '';
      callSid = params.get('CallSid') || '';
      calledNumber = params.get('To') || params.get('Called') || '';
    } catch (e) {
      console.error('clara-speak-response: body parse failed', e);
    }

    // Get context from URL query params (if passed from wellbeing calls)
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || '';
    const question = url.searchParams.get('question') || '';

    // Detect language from the number that was called
    const isSpain = calledNumber.startsWith('+34');
    const isNL = calledNumber.startsWith('+31');
    const voice = isSpain ? 'Polly.Conchita' : isNL ? 'Polly.Lotte' : 'Polly.Joanna';
    const lang = isSpain ? 'es-ES' : isNL ? 'nl-NL' : 'en-GB';

    console.log('clara-speak-response:', { digit, callSid, userId, question, calledNumber, lang });

    // If this is a wellbeing response, handle differently
    if (question) {
      return handleWellbeingResponse(digit, userId, question, callSid, voice, lang, isSpain, isNL);
    }

    // Standard safety check response — multilingual
    let responseText = '';

    if (digit === '1') {
      responseText = isSpain
        ? 'Gracias por confirmar que está a salvo. Su familia ha sido notificada. CLARA está aquí si necesita algo. Adiós.'
        : isNL
        ? 'Bedankt voor de bevestiging dat u veilig bent. Uw familie is op de hoogte gebracht. CLARA is er als u iets nodig heeft. Tot ziens.'
        : 'Thank you for confirming you are safe. Your family has been notified. CLARA is here if you need anything. Goodbye.';
      logSafeConfirmation(userId, callSid).catch(() => {});

    } else if (digit === '2') {
      responseText = isSpain
        ? 'Respuesta de emergencia activada. Su ubicación se está compartiendo con su familia ahora mismo. Por favor llame al 1 1 2 si necesita servicios de emergencia inmediatos. La ayuda está en camino.'
        : isNL
        ? 'Noodreactie geactiveerd. Uw locatie wordt nu gedeeld met uw familie. Bel 1 1 2 als u onmiddellijk hulpdiensten nodig heeft. Hulp is onderweg.'
        : 'Emergency response activated. Your location is being shared with your family right now. Please call 1 1 2 if you need immediate emergency services. Stay on the line if you can. Help is coming.';

    } else if (!digit) {
      responseText = isSpain
        ? 'No se ha recibido respuesta. Sus contactos de emergencia han sido notificados como precaución. Llame al 1 1 2 en caso de emergencia. Adiós.'
        : isNL
        ? 'Geen reactie ontvangen. Uw noodcontacten zijn uit voorzorg gewaarschuwd. Bel 1 1 2 in geval van nood. Tot ziens.'
        : 'No response received. Your emergency contacts have been notified as a precaution. Please call 1 1 2 in an emergency. Goodbye.';

    } else {
      responseText = isSpain
        ? 'Gracias. CLARA está monitorizando. Adiós.'
        : isNL
        ? 'Bedankt. CLARA houdt de situatie in de gaten. Tot ziens.'
        : 'Thank you. CLARA is monitoring. Goodbye.';
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${responseText}</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('clara-speak-response error:', error);

    // Even on error, ALWAYS return valid TwiML — never JSON or empty
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-GB">Thank you for your response. CLARA has noted your input. Goodbye.</Say>
  <Say voice="Polly.Conchita" language="es-ES">Gracias por su respuesta. CLARA ha registrado su información. Adiós.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });
  }
});

// Handle wellbeing/medication check-in responses
function handleWellbeingResponse(
  digit: string,
  userId: string,
  question: string,
  callSid: string,
  voice: string,
  lang: string,
  isSpain: boolean,
  isNL: boolean,
): Response {
  let responseText = 'Thank you for your response.';

  if (question === 'mood') {
    if (isSpain) {
      const responses: Record<string, string> = {
        '1': 'Maravilloso. Me alegra saber que se encuentra bien hoy.',
        '2': 'Me alegra saber que se siente bien.',
        '3': 'Gracias. Espero que su día mejore.',
        '4': 'Lamento escuchar eso. Se informará a su familia.',
        '5': 'Me preocupa cómo se siente. Se notificará a su familia de inmediato.',
      };
      responseText = responses[digit] || 'Gracias por su respuesta.';
    } else if (isNL) {
      const responses: Record<string, string> = {
        '1': 'Geweldig! Fijn om te horen dat u zich goed voelt vandaag.',
        '2': 'Goed om te horen dat u zich goed voelt.',
        '3': 'Bedankt. Ik hoop dat uw dag verbetert.',
        '4': 'Dat spijt me om te horen. Uw familie wordt geïnformeerd.',
        '5': 'Ik maak me zorgen over hoe u zich voelt. Uw familie wordt direct gewaarschuwd.',
      };
      responseText = responses[digit] || 'Bedankt voor uw reactie.';
    } else {
      const responses: Record<string, string> = {
        '1': 'Wonderful! I am glad to hear you are doing well today.',
        '2': 'Good to hear you are feeling good.',
        '3': 'Thank you. I hope your day improves.',
        '4': 'I am sorry to hear that. Your family will be updated.',
        '5': 'I am concerned about how you are feeling. Your family will be notified right away.',
      };
      responseText = responses[digit] || 'Thank you for your response.';
    }
  } else if (question === 'medication') {
    if (isSpain) {
      responseText = digit === '1'
        ? 'Excelente. Bien hecho por tomar su medicación. Que tenga un buen día.'
        : 'No se preocupe. Recuerde tomarla cuando pueda. Se informará a su familia.';
    } else if (isNL) {
      responseText = digit === '1'
        ? 'Uitstekend! Goed gedaan dat u uw medicatie heeft ingenomen. Fijne dag verder.'
        : 'Geen probleem. Vergeet niet om het in te nemen wanneer u kunt. Uw familie wordt geïnformeerd.';
    } else {
      responseText = digit === '1'
        ? 'Excellent! Well done for taking your medication. Have a great day.'
        : 'No problem. Please remember to take it when you can. Your family will be updated.';
    }
  }

  const goodbye = isSpain ? 'Cuídese. Adiós.' : isNL ? 'Pas goed op uzelf. Tot ziens.' : 'Stay safe. Goodbye.';

  // Store response and notify family in background (non-blocking)
  storeWellbeingResponse(userId, question, digit, callSid).catch(() => {});

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${responseText} ${goodbye}</Say>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

async function logSafeConfirmation(userId: string, callSid: string) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await supabase.from('voice_alert_logs').insert({
      user_id: userId || null,
      trigger_type: 'safe_confirmation',
      call_results: [{ digit: '1', outcome: 'confirmed_safe', call_sid: callSid }],
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('logSafeConfirmation failed:', e);
  }
}

async function storeWellbeingResponse(userId: string, question: string, digit: string, callSid: string) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (userId) {
      await supabase.from('wellbeing_responses').insert({
        user_id: userId,
        question_type: question,
        response_value: parseInt(digit || '0'),
        responded_at: new Date().toISOString(),
        channel: 'voice',
      });
    }

    // Alert family if needed
    const needsAlert =
      (question === 'mood' && parseInt(digit || '3') >= 4) ||
      (question === 'medication' && digit === '2') ||
      !digit;

    if (needsAlert && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, emergency_contacts')
        .eq('user_id', userId)
        .single();

      const memberName = profile?.first_name || 'Your family member';
      const contacts: Array<{ phone?: string }> =
        Array.isArray(profile?.emergency_contacts) ? profile.emergency_contacts : [];

      let alertMsg = '';
      if (question === 'mood' && digit) {
        alertMsg = parseInt(digit) >= 5
          ? `${memberName} reported feeling unwell (${digit}/5) during their CLARA check-in. Please check on them.`
          : `${memberName} reported feeling not great (${digit}/5) during their CLARA check-in.`;
      } else if (question === 'medication' && digit === '2') {
        alertMsg = `${memberName} has not yet taken their medication today.`;
      } else if (!digit) {
        alertMsg = `${memberName} did not respond to their CLARA ${question} check-in. Please check on them.`;
      }

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
          ).catch((e) => console.error('WhatsApp alert failed:', e));
        }
      }
    }
  } catch (e) {
    console.error('storeWellbeingResponse failed:', e);
  }
}
