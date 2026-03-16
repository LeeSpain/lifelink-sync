import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  sessionId?: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Contact form handler called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { name, email, subject, message, sessionId, language: reqLang }: ContactFormData = await req.json();
    const lang = reqLang || 'en';

    console.log('Processing contact form submission:', { name, email, subject, sessionId });

    // Enhanced validation and sanitization
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Input sanitization function
    const sanitizeInput = (input: string, maxLength: number = 1000): string => {
      if (!input) return '';
      let sanitized = input.trim();
      // Remove null bytes and control characters
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Remove script tags and dangerous content
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*['""][^'""]*['""]?/gi, '');
      sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
      // Limit length
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }
      return sanitized;
    };

    // Sanitize all inputs
    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedSubject = sanitizeInput(subject, 200);
    const sanitizedMessage = sanitizeInput(message, 5000);

    // Get client IP and user agent from headers
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Rate limiting check
    const { data: existingSubmissions } = await supabase
      .from('contact_submissions')
      .select('created_at')
      .eq('ip_address', clientIP)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false });

    if (existingSubmissions && existingSubmissions.length >= 3) {
      return new Response(JSON.stringify({ 
        error: 'Too many submissions. Please wait before submitting again.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Store contact submission in database using sanitized inputs
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        ip_address: clientIP,
        user_agent: userAgent,
        session_id: sessionId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to store submission' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Contact submission stored:', submission.id);

    // Create a lead entry in the CRM for tracking
    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          session_id: sessionId || crypto.randomUUID(),
          email: sanitizedEmail,
          interest_level: subject.toLowerCase().includes('join') || subject.toLowerCase().includes('subscribe') || subject.toLowerCase().includes('buy') ? 7 : 5,
          recommended_plan: subject.toLowerCase().includes('premium') ? 'Premium' : 'Basic',
          conversation_summary: `Contact form submission: ${sanitizedSubject}. Message: ${sanitizedMessage.substring(0, 200)}${sanitizedMessage.length > 200 ? '...' : ''}`,
          status: 'new',
          metadata: {
            source: 'contact_form',
            contact_submission_id: submission.id,
            name: sanitizedName,
            subject: sanitizedSubject,
            ip_address: clientIP,
            user_agent: userAgent
          }
        })
        .select()
        .single();

      if (leadError) {
        console.error('Error creating lead:', leadError);
      } else {
        console.log('Lead created:', leadData.id);
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      // Don't fail the main request if lead creation fails
    }

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: 'LifeLink Sync Contact <noreply@lifelink-sync.com>',
      to: ['hello@lifelink-sync.com'],
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr style="margin: 20px 0;">
        <p><strong>Technical Details:</strong></p>
        <ul>
          <li>IP Address: ${clientIP}</li>
          <li>User Agent: ${userAgent}</li>
          <li>Session ID: ${sessionId || 'Not provided'}</li>
          <li>Submitted: ${new Date().toISOString()}</li>
        </ul>
        <p><a href="https://supabase.com/dashboard/project/cprbgquiqbyoyrffznny" target="_blank">View in Admin Dashboard</a></p>
      `,
    });

    if (adminEmailResponse.error) {
      console.error('Failed to send admin notification email:', adminEmailResponse.error);
      // Don't fail the request if admin email fails - user confirmation is more important
    } else {
      console.log('Admin notification email sent successfully');
    }

    // i18n for confirmation email
    const contactI18n: Record<string, Record<string, string>> = {
      en: {
        subject: 'We received your message - LifeLink Sync',
        title: 'Thank you for contacting us!',
        dear: 'Dear',
        received: 'We have received your message and will get back to you as soon as possible. Our typical response time is 24-48 hours during business days.',
        summary: 'Your Message Summary:',
        subjectLabel: 'Subject:', messageLabel: 'Message:',
        emergency: 'If you have any urgent emergency needs, please remember that LifeLink Sync is designed to complement, not replace, traditional emergency services. In life-threatening situations, always contact your local emergency services (911, 112, etc.) immediately.',
        claraHelp: 'For immediate assistance with our app, you can also use our AI assistant Clara directly in the application.',
        regards: 'Best regards,', team: 'The LifeLink Sync Support Team',
        auto: 'This is an automated response to confirm we received your message.',
      },
      es: {
        subject: 'Hemos recibido tu mensaje - LifeLink Sync',
        title: '¡Gracias por contactarnos!',
        dear: 'Estimado/a',
        received: 'Hemos recibido tu mensaje y te responderemos lo antes posible. Nuestro tiempo de respuesta típico es de 24-48 horas en días laborables.',
        summary: 'Resumen de tu mensaje:',
        subjectLabel: 'Asunto:', messageLabel: 'Mensaje:',
        emergency: 'Si tienes alguna emergencia urgente, recuerda que LifeLink Sync está diseñado para complementar, no reemplazar, los servicios de emergencia tradicionales. En situaciones de riesgo vital, contacta siempre con los servicios de emergencia locales (112) inmediatamente.',
        claraHelp: 'Para asistencia inmediata con nuestra app, también puedes usar nuestra asistente IA Clara directamente en la aplicación.',
        regards: 'Saludos cordiales,', team: 'El Equipo de Soporte de LifeLink Sync',
        auto: 'Esta es una respuesta automática para confirmar que hemos recibido tu mensaje.',
      },
      nl: {
        subject: 'We hebben je bericht ontvangen - LifeLink Sync',
        title: 'Bedankt voor je bericht!',
        dear: 'Beste',
        received: 'We hebben je bericht ontvangen en nemen zo snel mogelijk contact met je op. Onze gebruikelijke reactietijd is 24-48 uur op werkdagen.',
        summary: 'Samenvatting van je bericht:',
        subjectLabel: 'Onderwerp:', messageLabel: 'Bericht:',
        emergency: 'Als je een dringende noodsituatie hebt, onthoud dan dat LifeLink Sync is ontworpen als aanvulling op de traditionele hulpdiensten. Bel bij levensbedreigende situaties altijd direct het alarmnummer (112).',
        claraHelp: 'Voor directe hulp met onze app kun je ook onze AI-assistent Clara gebruiken in de applicatie.',
        regards: 'Met vriendelijke groet,', team: 'Het LifeLink Sync Supportteam',
        auto: 'Dit is een automatisch antwoord ter bevestiging dat we je bericht hebben ontvangen.',
      },
    };
    const ct = contactI18n[lang] || contactI18n.en;

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: 'LifeLink Sync Support <support@lifelink-sync.com>',
      to: [email],
      subject: ct.subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; margin-bottom: 20px;">${ct.title}</h1>

          <p>${ct.dear} ${name},</p>

          <p>${ct.received}</p>

          <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${ct.summary}</h3>
            <p><strong>${ct.subjectLabel}</strong> ${subject}</p>
            <p><strong>${ct.messageLabel}</strong></p>
            <p style="color: #6b7280; font-style: italic;">${message.replace(/\n/g, '<br>')}</p>
          </div>

          <p>${ct.emergency}</p>

          <p>${ct.claraHelp}</p>

          <p>${ct.regards}<br>
          ${ct.team}</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="font-size: 12px; color: #6b7280;">
            ${ct.auto}
            Reference ID: ${submission.id}
          </p>
        </div>
      `,
    });

    if (userEmailResponse.error) {
      console.error('Failed to send user confirmation email:', userEmailResponse.error);
      return new Response(JSON.stringify({ 
        success: true, 
        submissionId: submission.id,
        warning: 'Message received but confirmation email failed to send'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('User confirmation email sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      submissionId: submission.id,
      message: 'Contact form submitted successfully. Check your email for confirmation.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in contact-form function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);