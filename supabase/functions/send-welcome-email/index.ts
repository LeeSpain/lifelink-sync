import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  language?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName, lastName, subscriptionTier, language: reqLang }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} for user ${userId}`);

    // Determine language — from request, profile, or default to 'en'
    let lang = reqLang || 'en';
    if (!reqLang) {
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', userId).maybeSingle();
      if (prof?.language_preference) lang = prof.language_preference;
    }

    const i18n: Record<string, Record<string, string>> = {
      en: {
        welcome: 'Welcome to LifeLink Sync!',
        active: 'Your personal safety network is now active',
        hello: 'Hello',
        thankYou: 'Thank you for joining LifeLink Sync, the ultimate personal safety platform. Your account has been successfully created and you\'re now protected by our advanced emergency response system.',
        getStarted: 'Get Started:',
        step1: 'Complete your profile and emergency contacts',
        step2: 'Set up your medical information',
        step3: 'Download our mobile app for instant SOS alerts',
        step4: 'Configure your location sharing preferences',
        dashboard: 'Access Your Dashboard',
        support: 'Get Support',
        planFeatures: 'Plan Features:',
        feat1: '24/7 Emergency Response', feat2: 'GPS Location Tracking', feat3: 'Medical Information Storage', feat4: 'Emergency Contact Alerts',
        nextSteps: 'Next Steps:',
        ns1: 'Complete Your Profile:', ns1d: 'Add your emergency contacts and medical information',
        ns2: 'Test the System:', ns2d: 'Try the SOS button in a safe environment',
        ns3: 'Share with Family:', ns3d: 'Invite family members to your safety network',
        claraHelp: 'If you have any questions, our AI assistant Clara is available 24/7 to help you.',
        footer: 'LifeLink Sync - Your Personal Safety Network',
        footerHelp: 'Need help? Visit our',
        supportCenter: 'support center',
        footerReply: 'or reply to this email.',
        subject: 'Welcome to LifeLink Sync - Your Safety Network is Active!',
      },
      es: {
        welcome: '¡Bienvenido a LifeLink Sync!',
        active: 'Tu red de seguridad personal está activa',
        hello: 'Hola',
        thankYou: 'Gracias por unirte a LifeLink Sync, la plataforma de seguridad personal definitiva. Tu cuenta ha sido creada y ahora estás protegido por nuestro sistema avanzado de respuesta de emergencia.',
        getStarted: 'Primeros pasos:',
        step1: 'Completa tu perfil y contactos de emergencia',
        step2: 'Configura tu información médica',
        step3: 'Descarga nuestra app móvil para alertas SOS instantáneas',
        step4: 'Configura tus preferencias de ubicación',
        dashboard: 'Accede a tu Panel',
        support: 'Obtener Soporte',
        planFeatures: 'Funciones del Plan:',
        feat1: 'Respuesta de Emergencia 24/7', feat2: 'Seguimiento GPS', feat3: 'Almacenamiento de Información Médica', feat4: 'Alertas a Contactos de Emergencia',
        nextSteps: 'Próximos pasos:',
        ns1: 'Completa tu Perfil:', ns1d: 'Añade tus contactos de emergencia e información médica',
        ns2: 'Prueba el Sistema:', ns2d: 'Prueba el botón SOS en un entorno seguro',
        ns3: 'Comparte con tu Familia:', ns3d: 'Invita a familiares a tu red de seguridad',
        claraHelp: 'Si tienes alguna pregunta, nuestra asistente IA Clara está disponible 24/7 para ayudarte.',
        footer: 'LifeLink Sync - Tu Red de Seguridad Personal',
        footerHelp: '¿Necesitas ayuda? Visita nuestro',
        supportCenter: 'centro de soporte',
        footerReply: 'o responde a este correo.',
        subject: '¡Bienvenido a LifeLink Sync - Tu Red de Seguridad está Activa!',
      },
      nl: {
        welcome: 'Welkom bij LifeLink Sync!',
        active: 'Je persoonlijke veiligheidsnetwerk is nu actief',
        hello: 'Hallo',
        thankYou: 'Bedankt dat je lid bent geworden van LifeLink Sync, het ultieme persoonlijke veiligheidsplatform. Je account is aangemaakt en je bent nu beschermd door ons geavanceerde noodresponssysteem.',
        getStarted: 'Aan de slag:',
        step1: 'Vul je profiel en noodcontacten aan',
        step2: 'Stel je medische informatie in',
        step3: 'Download onze mobiele app voor directe SOS-meldingen',
        step4: 'Stel je locatievoorkeuren in',
        dashboard: 'Ga naar je Dashboard',
        support: 'Hulp Krijgen',
        planFeatures: 'Plan Functies:',
        feat1: '24/7 Noodrespons', feat2: 'GPS Locatie Tracking', feat3: 'Medische Informatie Opslag', feat4: 'Noodcontact Meldingen',
        nextSteps: 'Volgende stappen:',
        ns1: 'Vul je Profiel aan:', ns1d: 'Voeg je noodcontacten en medische informatie toe',
        ns2: 'Test het Systeem:', ns2d: 'Probeer de SOS-knop in een veilige omgeving',
        ns3: 'Deel met Familie:', ns3d: 'Nodig familieleden uit voor je veiligheidsnetwerk',
        claraHelp: 'Heb je vragen? Onze AI-assistent Clara is 24/7 beschikbaar om je te helpen.',
        footer: 'LifeLink Sync - Je Persoonlijke Veiligheidsnetwerk',
        footerHelp: 'Hulp nodig? Bezoek ons',
        supportCenter: 'ondersteuningscentrum',
        footerReply: 'of beantwoord deze e-mail.',
        subject: 'Welkom bij LifeLink Sync - Je Veiligheidsnetwerk is Actief!',
      },
    };

    const t = i18n[lang] || i18n.en;

    // Create personalized welcome email content
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || (lang === 'es' ? 'Cliente Estimado' : lang === 'nl' ? 'Gewaardeerde Klant' : 'Valued Customer');
    const dashboardUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}.lovableproject.com/dashboard`;
    const supportUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}.lovableproject.com/dashboard/support`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ ${t.welcome}</h1>
              <p>${t.active}</p>
            </div>
            <div class="content">
              <h2>${t.hello} ${fullName}!</h2>
              <p>${t.thankYou}</p>

              <h3>🚀 ${t.getStarted}</h3>
              <ul>
                <li>${t.step1}</li>
                <li>${t.step2}</li>
                <li>${t.step3}</li>
                <li>${t.step4}</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="button">${t.dashboard}</a>
                <a href="${supportUrl}" class="button" style="background: #10B981;">${t.support}</a>
              </div>

              ${subscriptionTier ? `
                <div style="background: #EFF6FF; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3>🎯 ${subscriptionTier} ${t.planFeatures}</h3>
                  <ul>
                    <li>${t.feat1}</li>
                    <li>${t.feat2}</li>
                    <li>${t.feat3}</li>
                    <li>${t.feat4}</li>
                  </ul>
                </div>
              ` : ''}

              <h3>📱 ${t.nextSteps}</h3>
              <p>1. <strong>${t.ns1}</strong> ${t.ns1d}<br>
              2. <strong>${t.ns2}</strong> ${t.ns2d}<br>
              3. <strong>${t.ns3}</strong> ${t.ns3d}</p>

              <p>${t.claraHelp}</p>
            </div>
            <div class="footer">
              <p>${t.footer}<br>
              ${t.footerHelp} <a href="${supportUrl}">${t.supportCenter}</a> ${t.footerReply}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "LifeLink Sync <noreply@resend.dev>",
      to: [email],
      subject: `🛡️ ${t.subject}`,
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      recipient_email: email,
      subject: t.subject,
      email_type: "welcome",
      status: "sent",
      provider_message_id: emailResponse.data?.id
    });

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    
    // Log error to database if we have user info
    try {
      const body = await req.text();
      const data = JSON.parse(body);
      if (data.userId) {
        await supabase.from('email_logs').insert({
          user_id: data.userId,
          recipient_email: data.email,
          subject: "Welcome email",
          email_type: "welcome",
          status: "failed",
          error_message: error.message
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);