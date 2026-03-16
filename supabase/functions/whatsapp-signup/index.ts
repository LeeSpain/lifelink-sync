import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom  = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const leeNumber   = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
    }
  );
};

// Language from phone prefix
function detectLang(phone: string): 'en' | 'es' | 'nl' {
  const clean = phone.replace('whatsapp:', '');
  if (clean.startsWith('+34')) return 'es';
  if (clean.startsWith('+31')) return 'nl';
  return 'en';
}

// Translations
const T: Record<string, Record<string, string>> = {
  step1: {
    en: `Hi! I'm CLARA from LifeLink Sync 👋\nI can get you protected in under 2 minutes.\nWho are you looking to protect?\n\nReply with a number:\n1️⃣ Myself\n2️⃣ My mum\n3️⃣ My dad\n4️⃣ Both parents\n5️⃣ My employees / lone workers\n6️⃣ Not sure yet`,
    es: `¡Hola! Soy CLARA de LifeLink Sync 👋\nPuedo protegerte en menos de 2 minutos.\n¿A quién quieres proteger?\n\nResponde con un número:\n1️⃣ A mí mismo/a\n2️⃣ A mi madre\n3️⃣ A mi padre\n4️⃣ A ambos padres\n5️⃣ A mis empleados\n6️⃣ No estoy seguro/a todavía`,
    nl: `Hoi! Ik ben CLARA van LifeLink Sync 👋\nIk kan je in minder dan 2 minuten beschermen.\nVoor wie zoek je bescherming?\n\nAntwoord met een nummer:\n1️⃣ Mezelf\n2️⃣ Mijn moeder\n3️⃣ Mijn vader\n4️⃣ Beide ouders\n5️⃣ Mijn medewerkers\n6️⃣ Nog niet zeker`,
  },
  step2_self:   { en: "Great! What's your name?", es: "¡Genial! ¿Cómo te llamas?", nl: "Super! Hoe heet je?" },
  step2_mum:    { en: "Lovely. What's your name? (I'll ask about your mum's details next)", es: "Genial. ¿Cómo te llamas? (Luego te pregunto por los datos de tu madre)", nl: "Mooi. Hoe heet je? (Daarna vraag ik naar je moeders gegevens)" },
  step2_dad:    { en: "Great. What's your name?", es: "Genial. ¿Cómo te llamas?", nl: "Super. Hoe heet je?" },
  step2_parents:{ en: "Wonderful. What's your name?", es: "Estupendo. ¿Cómo te llamas?", nl: "Geweldig. Hoe heet je?" },
  step2_biz:    { en: "Perfect. What's your name and company name?", es: "Perfecto. ¿Tu nombre y el de tu empresa?", nl: "Perfect. Je naam en bedrijfsnaam?" },
  step2_unsure: { en: "No problem! What's your name? I'll help you figure it out.", es: "¡No pasa nada! ¿Cómo te llamas? Te ayudaré.", nl: "Geen probleem! Hoe heet je? Ik help je verder." },
  step3:        { en: "Almost done, NAME! What email should I send your trial details to?", es: "¡Casi listo, NAME! ¿A qué email envío los detalles de tu prueba?", nl: "Bijna klaar, NAME! Naar welk e-mailadres stuur ik je proefperiode details?" },
};

const WHO_FOR_MAP: Record<string, string> = { '1': 'self', '2': 'mum', '3': 'dad', '4': 'parents', '5': 'business', '6': 'unsure' };

const WHO_FOR_TEXT: Record<string, Record<string, string>> = {
  self:    { en: 'you', es: 'ti', nl: 'jou' },
  mum:     { en: 'your mum', es: 'tu madre', nl: 'je moeder' },
  dad:     { en: 'your dad', es: 'tu padre', nl: 'je vader' },
  parents: { en: 'your parents', es: 'tus padres', nl: 'je ouders' },
  business:{ en: 'your team', es: 'tu equipo', nl: 'je team' },
  unsure:  { en: 'you and your loved ones', es: 'ti y tus seres queridos', nl: 'jou en je dierbaren' },
};

serve(async (req) => {
  try {
    const { from, body: msg } = await req.json();
    const lang = detectLang(from);

    // Get or create signup record
    let { data: signup } = await supabase
      .from('whatsapp_signups')
      .select('*')
      .eq('phone', from)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (!signup) {
      // New signup — create record and send step 1
      const { data: newSignup } = await supabase
        .from('whatsapp_signups')
        .insert({ phone: from, step: 1, language: lang })
        .select()
        .single();
      signup = newSignup;

      await sendWhatsApp(from, T.step1[lang]);
      return new Response('', { status: 200 });
    }

    // ── STEP 1: Who is it for ──────────────────────────────────
    if (signup.step === 1) {
      const choice = msg.trim().replace(/️⃣/g, '').trim();
      const whoFor = WHO_FOR_MAP[choice];

      if (!whoFor) {
        await sendWhatsApp(from, lang === 'es' ? 'Responde con un número del 1 al 6 por favor.' : lang === 'nl' ? 'Antwoord met een nummer van 1 tot 6 alsjeblieft.' : 'Please reply with a number from 1 to 6.');
        return new Response('', { status: 200 });
      }

      await supabase.from('whatsapp_signups')
        .update({ who_for: whoFor, step: 2, updated_at: new Date().toISOString() })
        .eq('id', signup.id);

      const step2Key = `step2_${whoFor}` as keyof typeof T;
      const step2Msg = T[step2Key]?.[lang] || T.step2_self[lang];
      await sendWhatsApp(from, step2Msg);
      return new Response('', { status: 200 });
    }

    // ── STEP 2: Name ───────────────────────────────────────────
    if (signup.step === 2) {
      const name = msg.trim();
      if (name.length < 2) {
        await sendWhatsApp(from, lang === 'es' ? 'Necesito tu nombre por favor.' : lang === 'nl' ? 'Ik heb je naam nodig.' : 'I need your name please.');
        return new Response('', { status: 200 });
      }

      await supabase.from('whatsapp_signups')
        .update({ full_name: name, step: 3, updated_at: new Date().toISOString() })
        .eq('id', signup.id);

      const firstName = name.split(' ')[0];
      const step3Msg = T.step3[lang].replace('NAME', firstName);
      await sendWhatsApp(from, step3Msg);
      return new Response('', { status: 200 });
    }

    // ── STEP 3: Email → Account Creation ───────────────────────
    if (signup.step === 3) {
      const email = msg.trim().toLowerCase();
      if (!email.includes('@') || !email.includes('.')) {
        await sendWhatsApp(from, lang === 'es' ? 'Necesito un email válido por favor.' : lang === 'nl' ? 'Ik heb een geldig e-mailadres nodig.' : 'I need a valid email address please.');
        return new Response('', { status: 200 });
      }

      // Update email
      await supabase.from('whatsapp_signups')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('id', signup.id);

      // Create Supabase Auth user
      const cleanPhone = from.replace('whatsapp:', '');
      let userId: string | null = null;

      try {
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
          email,
          phone: cleanPhone,
          email_confirm: true,
          user_metadata: {
            full_name: signup.full_name,
            signup_source: 'whatsapp',
            who_for: signup.who_for,
            language: lang,
          },
        });

        if (authErr) {
          console.error('Auth user creation failed:', authErr);
          // User may already exist — try to find them
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existing = existingUsers?.users?.find((u: { email?: string }) => u.email === email);
          if (existing) userId = existing.id;
        } else {
          userId = authUser.user?.id ?? null;
        }
      } catch (e) {
        console.error('Auth creation error:', e);
      }

      // Create profile
      if (userId) {
        await supabase.from('profiles').upsert({
          user_id: userId,
          first_name: signup.full_name?.split(' ')[0] || '',
          last_name: signup.full_name?.split(' ').slice(1).join(' ') || '',
          phone: cleanPhone,
          language_preference: lang,
        }, { onConflict: 'user_id' });
      }

      // Create subscriber record (trial)
      if (userId) {
        await supabase.from('subscribers').upsert({
          user_id: userId,
          email,
          subscribed: true,
          subscription_tier: 'trial',
          subscription_end: new Date(Date.now() + 7 * 86400000).toISOString(),
        }, { onConflict: 'email' });

        // Create trial tracking
        await supabase.from('trial_tracking').insert({
          user_id: userId,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'active',
        }).then(() => {}).catch(() => {});
      }

      // Mark signup complete
      await supabase.from('whatsapp_signups')
        .update({
          status: 'completed',
          supabase_user_id: userId,
          trial_activated: true,
          step: 4,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signup.id);

      // Create lead
      await supabase.from('leads').insert({
        session_id: crypto.randomUUID(),
        user_id: userId,
        email,
        phone: cleanPhone,
        interest_level: 8,
        status: 'qualified',
        metadata: {
          source: 'whatsapp_signup',
          who_for: signup.who_for,
          language: lang,
          full_name: signup.full_name,
        },
      }).catch(() => {});

      // Update clara memory
      await supabase.functions.invoke('clara-memory', {
        body: {
          action: 'upsert',
          session_id: `wa-signup-${from}`,
          user_id: userId,
          contact_phone: cleanPhone,
          contact_email: email,
          first_name: signup.full_name?.split(' ')[0],
          language: lang,
          journey_stage: 'trial_started',
          protecting: signup.who_for,
          last_outcome: 'WhatsApp signup completed — trial activated',
          interest_score: 8,
        },
      }).catch(() => {});

      // Send confirmation
      const firstName = signup.full_name?.split(' ')[0] || '';
      const whoText = WHO_FOR_TEXT[signup.who_for || 'self']?.[lang] || WHO_FOR_TEXT.self[lang];

      const confirmations: Record<string, string> = {
        en: `🛡️ You're protected, ${firstName}!\n\nYour 7-day free trial is now active.\nNo card needed yet.\n\n✅ CLARA is watching over ${whoText}\n✅ Emergency contacts can be added online\n✅ SOS alerts active from day one\n\nSet up your full account here:\nhttps://lifelink-sync.com/auth\n\nYou'll get a setup email at ${email} shortly.\n\nAny questions? Just message me here 24/7.`,
        es: `🛡️ ¡Estás protegido/a, ${firstName}!\n\nTu prueba gratuita de 7 días está activa.\nNo necesitas tarjeta todavía.\n\n✅ CLARA cuida de ${whoText}\n✅ Puedes añadir contactos de emergencia online\n✅ Alertas SOS activas desde el primer día\n\nConfigura tu cuenta completa aquí:\nhttps://lifelink-sync.com/auth\n\nRecibirás un email en ${email} en breve.\n\n¿Preguntas? Escríbeme aquí las 24h.`,
        nl: `🛡️ Je bent beschermd, ${firstName}!\n\nJe gratis proefperiode van 7 dagen is actief.\nGeen creditcard nodig.\n\n✅ CLARA waakt over ${whoText}\n✅ Noodcontacten kun je online toevoegen\n✅ SOS-meldingen actief vanaf dag één\n\nStel je volledige account in:\nhttps://lifelink-sync.com/auth\n\nJe ontvangt een e-mail op ${email}.\n\nVragen? Stuur me hier een bericht, 24/7.`,
      };

      await sendWhatsApp(from, confirmations[lang]);

      // Alert Lee
      await sendWhatsApp(leeNumber,
        `🆕 New WhatsApp sign-up!\nName: ${signup.full_name}\nEmail: ${email}\nPhone: ${cleanPhone}\nFor: ${signup.who_for}\nLanguage: ${lang}\nTrial activated ✅`
      );

      return new Response('', { status: 200 });
    }

    // Signup already completed — pass to normal CLARA
    return new Response('', { status: 200 });

  } catch (error) {
    console.error('whatsapp-signup error:', error);
    return new Response('', { status: 200 });
  }
});
