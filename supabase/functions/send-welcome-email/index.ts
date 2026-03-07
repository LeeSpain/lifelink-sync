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
    const { userId, email, firstName, lastName, subscriptionTier }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} for user ${userId}`);

    // Create personalized welcome email content
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || "Valued Customer";
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
              <h1>🛡️ Welcome to LifeLink Sync!</h1>
              <p>Your personal safety network is now active</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName}!</h2>
              <p>Thank you for joining LifeLink Sync, the ultimate personal safety platform. Your account has been successfully created and you're now protected by our advanced emergency response system.</p>
              
              <h3>🚀 Get Started:</h3>
              <ul>
                <li>Complete your profile and emergency contacts</li>
                <li>Set up your medical information</li>
                <li>Download our mobile app for instant SOS alerts</li>
                <li>Configure your location sharing preferences</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
                <a href="${supportUrl}" class="button" style="background: #10B981;">Get Support</a>
              </div>

              ${subscriptionTier ? `
                <div style="background: #EFF6FF; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3>🎯 Your ${subscriptionTier} Plan Features:</h3>
                  <ul>
                    <li>24/7 Emergency Response</li>
                    <li>GPS Location Tracking</li>
                    <li>Medical Information Storage</li>
                    <li>Emergency Contact Alerts</li>
                    ${subscriptionTier.toLowerCase().includes('premium') ? '<li>Family Account Sharing</li><li>Advanced AI Chat Support</li>' : ''}
                  </ul>
                </div>
              ` : ''}

              <h3>📱 Next Steps:</h3>
              <p>1. <strong>Complete Your Profile:</strong> Add your emergency contacts and medical information<br>
              2. <strong>Test the System:</strong> Try the SOS button in a safe environment<br>
              3. <strong>Share with Family:</strong> Invite family members to your safety network</p>

              <p>If you have any questions, our AI assistant Clara is available 24/7 to help you.</p>
            </div>
            <div class="footer">
              <p>LifeLink Sync - Your Personal Safety Network<br>
              Need help? Visit our <a href="${supportUrl}">support center</a> or reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "LifeLink Sync <noreply@resend.dev>",
      to: [email],
      subject: "🛡️ Welcome to LifeLink Sync - Your Safety Network is Active!",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      recipient_email: email,
      subject: "Welcome to LifeLink Sync - Your Safety Network is Active!",
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
          subject: "Welcome to LifeLink Sync - Your Safety Network is Active!",
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