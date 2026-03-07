import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FreeTrialSignupData {
  name: string;
  email: string;
  phone: string;
  sessionId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Free trial signup handler called');

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { name, email, phone, sessionId }: FreeTrialSignupData = await req.json();

    console.log('Processing free trial signup:', { name, email, phone, sessionId });

    // Validation
    if (!name || !email || !phone) {
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

    // Sanitize inputs
    const sanitizeInput = (input: string, maxLength: number = 1000): string => {
      if (!input) return '';
      let sanitized = input.trim();
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*['""][^'""]*['""]?/gi, '');
      sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }
      return sanitized;
    };

    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPhone = sanitizeInput(phone, 20);

    // Get client info
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Rate limiting check
    const { data: existingTrials } = await supabase
      .from('leads')
      .select('created_at')
      .eq('email', sanitizedEmail)
      .eq('status', 'trial_signup')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (existingTrials && existingTrials.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'You have already requested a free trial. Please check your email or contact support.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Calculate trial expiry date (7 days from now)
    const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create lead entry for trial signup
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        session_id: sessionId || crypto.randomUUID(),
        email: sanitizedEmail,
        phone: sanitizedPhone,
        interest_level: 9, // High interest for trial signups
        recommended_plan: 'Premium Protection',
        conversation_summary: `Free trial signup: ${sanitizedName} requested 7-day trial access.`,
        status: 'trial_signup',
        metadata: {
          source: 'free_trial_popup',
          name: sanitizedName,
          phone: sanitizedPhone,
          trial_expires_at: trialExpiresAt.toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
          trial_length_days: 7
        }
      })
      .select()
      .single();

    if (leadError) {
      console.error('Database error:', leadError);
      return new Response(JSON.stringify({ error: 'Failed to process trial signup' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Trial signup stored:', leadData.id);

    // Send welcome email to user with trial activation
    const userEmailResponse = await resend.emails.send({
      from: 'LifeLink Sync <welcome@lifelink-sync.com>',
      to: [sanitizedEmail],
      subject: '🎉 Your 7-Day Free Trial is Ready!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; color: white;">
          <div style="padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0 0 20px 0; font-size: 28px;">Welcome to LifeLink Sync!</h1>
            <p style="font-size: 18px; margin: 0; opacity: 0.9;">Your 7-day free trial starts now</p>
          </div>
          
          <div style="background: white; color: #333; padding: 40px 30px; margin: 0;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">Dear ${sanitizedName},</p>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Congratulations! Your 7-day free trial has been activated. You now have full access to all LifeLink Sync premium features including:
            </p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #1a202c; margin: 0 0 15px 0;">What's Included in Your Trial:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
                <li style="margin-bottom: 8px;">🚨 Emergency SOS with live location sharing</li>
                <li style="margin-bottom: 8px;">👨‍👩‍👧‍👦 Family protection plans</li>
                <li style="margin-bottom: 8px;">📱 Mobile app access</li>
                <li style="margin-bottom: 8px;">🤖 AI-powered emergency assistance</li>
                <li style="margin-bottom: 8px;">🔗 Flic button integration</li>
                <li>📞 24/7 emergency contact system</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://lifelink-sync.com/register?trial=true&email=${encodeURIComponent(sanitizedEmail)}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Activate Your Trial Now
              </a>
            </div>
            
            <div style="background: #fef7e0; border-left: 4px solid #f6ad55; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h4 style="color: #744210; margin: 0 0 10px 0;">Trial Details:</h4>
              <p style="color: #744210; margin: 0; font-size: 14px;">
                <strong>Trial expires:</strong> ${trialExpiresAt.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}<br>
                <strong>Your contact:</strong> ${sanitizedPhone}<br>
                <strong>No credit card required</strong> - Cancel anytime
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 25px 0;">
              Need help getting started? Our support team is here to assist you. Simply reply to this email or use our in-app chat feature.
            </p>
            
            <p style="font-size: 16px; margin: 25px 0 0 0;">
              Best regards,<br>
              <strong>The LifeLink Sync Team</strong>
            </p>
          </div>
          
          <div style="padding: 20px 30px; text-align: center; opacity: 0.8;">
            <p style="margin: 0; font-size: 12px;">
              Trial ID: ${leadData.id} | This email was sent to ${sanitizedEmail}
            </p>
          </div>
        </div>
      `,
    });

    if (userEmailResponse.error) {
      console.error('Failed to send trial welcome email:', userEmailResponse.error);
    } else {
      console.log('Trial welcome email sent successfully');
    }

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: 'LifeLink Sync Trials <noreply@lifelink-sync.com>',
      to: ['hello@lifelink-sync.com'],
      subject: `🆕 New 7-Day Trial Signup: ${sanitizedName}`,
      html: `
        <h2>New Free Trial Signup</h2>
        <p><strong>Lead ID:</strong> ${leadData.id}</p>
        <p><strong>Name:</strong> ${sanitizedName}</p>
        <p><strong>Email:</strong> ${sanitizedEmail}</p>
        <p><strong>Phone:</strong> ${sanitizedPhone}</p>
        <p><strong>Trial Expires:</strong> ${trialExpiresAt.toISOString()}</p>
        <hr>
        <p><strong>Technical Details:</strong></p>
        <ul>
          <li>IP Address: ${clientIP}</li>
          <li>User Agent: ${userAgent}</li>
          <li>Session ID: ${sessionId}</li>
          <li>Signed up: ${new Date().toISOString()}</li>
        </ul>
        <p><a href="https://supabase.com/dashboard/project/mqroziggaalltuzoyyao" target="_blank">View in Admin Dashboard</a></p>
      `,
    });

    if (adminEmailResponse.error) {
      console.error('Failed to send admin notification:', adminEmailResponse.error);
    } else {
      console.log('Admin notification sent successfully');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      leadId: leadData.id,
      trialExpiresAt: trialExpiresAt.toISOString(),
      message: 'Free trial activated! Check your email for next steps.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in free-trial-signup function:', error);
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