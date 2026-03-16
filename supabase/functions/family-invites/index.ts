import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl      = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey     = Deno.env.get("RESEND_API_KEY");
const twilioSid        = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioToken      = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioFrom       = Deno.env.get("TWILIO_WHATSAPP_FROM");
const adminWhatsApp    = Deno.env.get("TWILIO_WHATSAPP_LEE");

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FAMILY-INVITES] ${step}${detailsStr}`);
};

// ── Send invite email via Resend ───────────────────────────────
async function sendInviteEmail(
  to: string,
  inviterName: string,
  inviteeName: string,
  token: string,
  lang: string = 'en',
): Promise<boolean> {
  if (!resendApiKey) {
    logStep('RESEND_API_KEY not set — skipping email', { to });
    return false;
  }

  const inviteUrl = `https://lifelink-sync.com/invite/connections/${token}`;

  const invI18n: Record<string, Record<string, string>> = {
    en: {
      subtitle: 'Emergency Protection Platform',
      hi: 'Hi', setup: 'has set up CLARA emergency protection for you through LifeLink Sync.',
      meaning: 'This means if you ever need help in an emergency, NAME will be instantly notified with your GPS location, and our AI assistant CLARA will coordinate the response. It takes 2 minutes to activate and you do not need a credit card.',
      getLabel: 'Here is what you get:',
      f1: 'One-touch SOS alerts to your family circle', f2: 'Live GPS location sharing during emergencies',
      f3: 'CLARA AI assistant available 24/7', f4: 'Medical profile shared with first responders',
      cta: 'Activate my CLARA', expires: 'This invite expires in 7 days. If you have any questions, just reply to this email.',
      subject: 'NAME has set up CLARA protection for you',
    },
    es: {
      subtitle: 'Plataforma de Protección de Emergencias',
      hi: 'Hola', setup: 'ha configurado la protección de emergencia CLARA para ti a través de LifeLink Sync.',
      meaning: 'Esto significa que si alguna vez necesitas ayuda en una emergencia, NAME será notificado/a instantáneamente con tu ubicación GPS, y nuestra asistente IA CLARA coordinará la respuesta. Toma 2 minutos activar y no necesitas tarjeta de crédito.',
      getLabel: 'Esto es lo que recibes:',
      f1: 'Alertas SOS con un solo toque a tu círculo familiar', f2: 'Ubicación GPS en vivo durante emergencias',
      f3: 'Asistente IA CLARA disponible 24/7', f4: 'Perfil médico compartido con servicios de emergencia',
      cta: 'Activar mi CLARA', expires: 'Esta invitación expira en 7 días. Si tienes preguntas, responde a este correo.',
      subject: 'NAME ha configurado protección CLARA para ti',
    },
    nl: {
      subtitle: 'Noodbeschermingsplatform',
      hi: 'Hallo', setup: 'heeft CLARA noodbescherming voor je ingesteld via LifeLink Sync.',
      meaning: 'Dit betekent dat als je ooit hulp nodig hebt in een noodsituatie, NAME direct wordt gewaarschuwd met je GPS-locatie, en onze AI-assistent CLARA de respons coördineert. Het activeren duurt 2 minuten en je hebt geen creditcard nodig.',
      getLabel: 'Dit is wat je krijgt:',
      f1: 'Eén-druk SOS-meldingen naar je familiekring', f2: 'Live GPS-locatie delen tijdens noodsituaties',
      f3: 'CLARA AI-assistent 24/7 beschikbaar', f4: 'Medisch profiel gedeeld met hulpdiensten',
      cta: 'Mijn CLARA activeren', expires: 'Deze uitnodiging verloopt over 7 dagen. Heb je vragen? Beantwoord dan deze e-mail.',
      subject: 'NAME heeft CLARA-bescherming voor je ingesteld',
    },
  };
  const it = invI18n[lang] || invI18n.en;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

<div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 12px 12px 0 0;">
  <h1 style="color: white; margin: 0; font-size: 24px;">LifeLink Sync</h1>
  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${it.subtitle}</p>
</div>

<div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
  <h2 style="color: #111; margin: 0 0 16px;">${it.hi} ${inviteeName},</h2>

  <p>${inviterName} ${it.setup}</p>

  <p>${it.meaning.replace(/NAME/g, inviterName)}</p>

  <p>${it.getLabel}</p>
  <ul style="padding-left: 20px; color: #555;">
    <li>${it.f1}</li>
    <li>${it.f2}</li>
    <li>${it.f3}</li>
    <li>${it.f4}</li>
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${it.cta} &rarr;</a>
  </div>

  <p style="color: #888; font-size: 13px;">${it.expires}</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

  <p style="color: #666; font-size: 13px; margin: 0;">— CLARA, LifeLink Sync 🛡️</p>
</div>

</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CLARA from LifeLink Sync <clara@lifelink-sync.com>',
        to: [to],
        subject: it.subject.replace(/NAME/g, inviterName),
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logStep('Resend error', { status: response.status, error: err });
      return false;
    }

    logStep('Invite email sent', { to });
    return true;
  } catch (err) {
    logStep('Resend send failed', { error: String(err) });
    return false;
  }
}

// ── Send WhatsApp confirmation to billing owner ────────────────
async function notifyOwnerWhatsApp(inviteeName: string, inviteeEmail: string): Promise<void> {
  if (!twilioSid || !twilioToken || !twilioFrom || !adminWhatsApp) {
    logStep('Twilio not configured — skipping WhatsApp notification');
    return;
  }

  const body = `✅ Invite sent to ${inviteeName} at ${inviteeEmail}. They'll receive a magic link to activate their CLARA. I'll notify you when they join.`;

  try {
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: adminWhatsApp,
          From: twilioFrom,
          Body: body,
        }).toString(),
      }
    );
    logStep('Owner WhatsApp notification sent');
  } catch (err) {
    logStep('WhatsApp notification failed (non-fatal)', { error: String(err) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get inviter's name and language for the email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, language_preference')
      .eq('user_id', user.id)
      .maybeSingle();

    const inviterName = profile?.first_name
      ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
      : user.email.split('@')[0];

    if (req.method === "POST") {
      const { email, name, relationship } = await req.json();

      if (!email || !name) {
        throw new Error("Email and name are required");
      }

      // Create family invite record
      const inviteToken = crypto.randomUUID();
      const { data: invite, error: inviteError } = await supabaseClient
        .from('family_invites')
        .insert({
          inviter_user_id: user.id,
          inviter_email: user.email,
          invitee_email: email,
          invitee_name: name,
          relationship: relationship || 'Family Member',
          status: 'pending',
          invite_token: inviteToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      logStep("Family invite created", { inviteId: invite.id, inviteeEmail: email });

      // Send invite email via Resend
      const inviteLang = profile?.language_preference || 'en';
      const emailSent = await sendInviteEmail(email, inviterName, name, inviteToken, inviteLang);

      // Send WhatsApp confirmation to billing owner
      await notifyOwnerWhatsApp(name, email);

      return new Response(JSON.stringify({
        success: true,
        invite,
        email_sent: emailSent,
        message: emailSent
          ? `Invitation sent to ${email} — they'll receive an email with a magic link`
          : `Invitation created for ${email} — email sending not configured yet`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // GET — return family members and pending invites
      const { data: familyMembers, error: membersError } = await supabaseClient
        .from('family_invites')
        .select('*')
        .eq('inviter_user_id', user.id)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      logStep("Retrieved family members", { count: familyMembers?.length || 0 });

      return new Response(JSON.stringify({ familyMembers: familyMembers || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in family-invites", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
