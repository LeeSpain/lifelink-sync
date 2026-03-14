import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey     = Deno.env.get('RESEND_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Email templates per day and language ────────────────────────
const templates: Record<number, Record<string, { subject: string; body: string }>> = {
  3: {
    en: {
      subject: 'How is your LifeLink Sync trial going?',
      body: `Hi there,

It's been a few days since you started your LifeLink Sync trial, and I wanted to check in personally.

Have you had a chance to set up your emergency contacts and try the SOS button? Those are the two things that make the biggest difference right away.

If you need any help getting set up, just reply to this email and I'll walk you through it myself.

You still have a few days left on your free trial — let's make sure you get the most out of it.

Best,
Lee Wakeman
Founder, LifeLink Sync`,
    },
    es: {
      subject: 'Como va tu prueba de LifeLink Sync?',
      body: `Hola,

Han pasado unos dias desde que empezaste tu prueba de LifeLink Sync y queria escribirte personalmente.

Has tenido oportunidad de configurar tus contactos de emergencia y probar el boton SOS? Son las dos cosas que marcan la mayor diferencia desde el principio.

Si necesitas ayuda con la configuracion, responde a este email y te guiare personalmente.

Todavia te quedan unos dias de prueba gratuita — asegurate de aprovecharla al maximo.

Un saludo,
Lee Wakeman
Fundador, LifeLink Sync`,
    },
    nl: {
      subject: 'Hoe gaat je LifeLink Sync proefperiode?',
      body: `Hallo,

Het is een paar dagen geleden dat je je LifeLink Sync proefperiode startte en ik wilde even persoonlijk contact opnemen.

Heb je al je noodcontacten ingesteld en de SOS-knop geprobeerd? Dat zijn de twee dingen die meteen het grootste verschil maken.

Als je hulp nodig hebt bij het instellen, antwoord dan op deze e-mail en ik begeleid je er persoonlijk doorheen.

Je hebt nog een paar dagen van je gratis proefperiode — laten we ervoor zorgen dat je er het meeste uit haalt.

Met vriendelijke groet,
Lee Wakeman
Oprichter, LifeLink Sync`,
    },
  },
  6: {
    en: {
      subject: 'Your LifeLink Sync trial ends tomorrow',
      body: `Hi there,

Just a quick note — your LifeLink Sync free trial ends tomorrow.

If you've been using it, you already know the peace of mind it brings. The Individual Plan is just 9.99 EUR/month and includes everything: SOS alerts, GPS tracking, CLARA AI, Family Circle, and your first Family Link free.

If you haven't had a chance to try everything yet, today is the day. Set up your contacts, test the SOS button, and see how it feels to know help is always one tap away.

No pressure at all — but I'd hate for you to lose access to something that could genuinely protect you or someone you love.

Reply if you have any questions. I read every email personally.

Lee Wakeman
Founder, LifeLink Sync`,
    },
    es: {
      subject: 'Tu prueba de LifeLink Sync termina manana',
      body: `Hola,

Solo una nota rapida — tu prueba gratuita de LifeLink Sync termina manana.

Si la has estado usando, ya conoces la tranquilidad que ofrece. El Plan Individual cuesta solo 9,99 EUR/mes e incluye todo: alertas SOS, GPS, CLARA IA, Circulo Familiar y tu primer Enlace Familiar gratis.

Si aun no has tenido oportunidad de probarlo todo, hoy es el dia. Configura tus contactos, prueba el boton SOS y siente la seguridad de saber que la ayuda esta siempre a un toque.

Sin presion — pero no me gustaria que perdieras acceso a algo que puede protegerte a ti o a alguien que quieres.

Responde si tienes preguntas. Leo cada email personalmente.

Lee Wakeman
Fundador, LifeLink Sync`,
    },
    nl: {
      subject: 'Je LifeLink Sync proefperiode eindigt morgen',
      body: `Hallo,

Even een kort bericht — je gratis LifeLink Sync proefperiode eindigt morgen.

Als je het hebt gebruikt, weet je al welke gemoedsrust het biedt. Het Individueel Plan kost slechts 9,99 EUR/maand en bevat alles: SOS-meldingen, GPS, CLARA AI, Familiekring en je eerste Familie Link gratis.

Als je nog niet alles hebt kunnen proberen, is vandaag de dag. Stel je contacten in, test de SOS-knop en voel hoe het is om te weten dat hulp altijd een tik verwijderd is.

Geen druk — maar het zou jammer zijn als je toegang verliest tot iets dat jou of iemand van wie je houdt echt kan beschermen.

Antwoord als je vragen hebt. Ik lees elke e-mail persoonlijk.

Lee Wakeman
Oprichter, LifeLink Sync`,
    },
  },
  7: {
    en: {
      subject: 'Your free trial ends today — stay protected',
      body: `Hi there,

This is your last day on the LifeLink Sync free trial.

After today, your emergency protection will stop working. Your contacts won't be notified, your GPS won't be shared, and CLARA won't be there if you need her.

If you want to stay protected, it takes 30 seconds to subscribe:
https://lifelink-sync.com/dashboard

The Individual Plan is 9.99 EUR/month. Cancel anytime. Full refund within 7 days if you change your mind.

I genuinely hope you'll stay. This is protection that matters.

Lee Wakeman
Founder, LifeLink Sync`,
    },
    es: {
      subject: 'Tu prueba gratuita termina hoy — mantente protegido',
      body: `Hola,

Hoy es tu ultimo dia de la prueba gratuita de LifeLink Sync.

Despues de hoy, tu proteccion de emergencia dejara de funcionar. Tus contactos no seran notificados, tu GPS no se compartira, y CLARA no estara ahi si la necesitas.

Si quieres seguir protegido, solo toma 30 segundos suscribirte:
https://lifelink-sync.com/dashboard

El Plan Individual cuesta 9,99 EUR/mes. Cancela cuando quieras. Reembolso completo en 7 dias si cambias de opinion.

Espero sinceramente que te quedes. Esta es proteccion que importa.

Lee Wakeman
Fundador, LifeLink Sync`,
    },
    nl: {
      subject: 'Je gratis proefperiode eindigt vandaag — blijf beschermd',
      body: `Hallo,

Dit is je laatste dag van de gratis LifeLink Sync proefperiode.

Na vandaag stopt je noodbescherming. Je contacten worden niet meer gewaarschuwd, je GPS wordt niet meer gedeeld en CLARA is er niet meer als je haar nodig hebt.

Als je beschermd wilt blijven, duurt het 30 seconden om je te abonneren:
https://lifelink-sync.com/dashboard

Het Individueel Plan kost 9,99 EUR/maand. Op elk moment opzegbaar. Volledige terugbetaling binnen 7 dagen als je van gedachten verandert.

Ik hoop oprecht dat je blijft. Dit is bescherming die ertoe doet.

Lee Wakeman
Oprichter, LifeLink Sync`,
    },
  },
};

// ── Send email via Resend ──────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!resendApiKey) {
    console.log(`[STUB] Would send email to ${to}: ${subject}`);
    return true; // stub success when no API key
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lee from LifeLink Sync <lee@lifelink-sync.com>',
      to: [to],
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Resend error for ${to}:`, err);
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('clara-trial-followup invoked');

  try {
    // Accept optional day parameter, or process all days
    let targetDays = [3, 6, 7];
    try {
      const body = await req.json();
      if (body?.day) targetDays = [body.day];
    } catch {
      // No body or invalid JSON — process all days
    }

    const results: Record<number, { found: number; sent: number; skipped: number }> = {};

    for (const day of targetDays) {
      const template = templates[day];
      if (!template) continue;

      results[day] = { found: 0, sent: 0, skipped: 0 };

      // Calculate the date range for trials that started exactly `day` days ago
      const now = new Date();
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - day);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find active trials that started on the target date
      const { data: trials } = await supabase
        .from('trial_tracking')
        .select('id, user_id, trial_start')
        .eq('status', 'active')
        .gte('trial_start', dayStart.toISOString())
        .lte('trial_start', dayEnd.toISOString());

      if (!trials?.length) continue;
      results[day].found = trials.length;

      for (const trial of trials) {
        // Check if we already sent this follow-up
        const logKey = `trial_day${day}_${trial.user_id}`;
        const { data: existing } = await supabase
          .from('followup_send_log')
          .select('id')
          .eq('status', 'queued')
          .limit(1);

        // Use a simpler dedup: check clara_contact_memory for last_outcome containing this day
        const { data: memory } = await supabase
          .from('clara_contact_memory')
          .select('id, last_outcome')
          .eq('user_id', trial.user_id)
          .maybeSingle();

        if (memory?.last_outcome?.includes(`trial_day${day}_sent`)) {
          results[day].skipped++;
          continue;
        }

        // Get user email and language preference
        const { data: profile } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('user_id', trial.user_id)
          .maybeSingle();

        const { data: subscriber } = await supabase
          .from('subscribers')
          .select('email')
          .eq('user_id', trial.user_id)
          .maybeSingle();

        const email = subscriber?.email;
        if (!email) {
          console.warn(`No email for user ${trial.user_id}, skipping`);
          results[day].skipped++;
          continue;
        }

        const lang = profile?.language_preference ?? 'en';
        const validLang = ['en', 'es', 'nl'].includes(lang) ? lang : 'en';
        const emailTemplate = template[validLang] ?? template['en'];

        // Send the email
        const sent = await sendEmail(email, emailTemplate.subject, emailTemplate.body);

        if (sent) {
          results[day].sent++;

          // Record in memory to prevent resend
          try {
            await supabase.functions.invoke('clara-memory', {
              body: {
                action: 'upsert',
                session_id: `trial-followup-${trial.user_id}`,
                user_id: trial.user_id,
                last_outcome: `trial_day${day}_sent`,
                journey_stage: day === 7 ? 'trial_active' : 'trial_started',
              },
            });
          } catch (memErr) {
            console.warn('Memory update failed (non-fatal):', memErr);
          }
        } else {
          results[day].skipped++;
        }
      }
    }

    console.log('Trial follow-up results:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clara-trial-followup error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
