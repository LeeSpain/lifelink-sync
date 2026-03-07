import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmergencySOSRequest {
  userProfile: {
    first_name: string;
    last_name: string;
    emergency_contacts: Array<{
      name: string;
      email?: string;
      phone: string;
      relationship: string;
    }>;
  };
  location: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userProfile, location, timestamp }: EmergencySOSRequest = await req.json();
    
    const userName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
    const emergencyTime = new Date(timestamp).toLocaleString();
    
    console.log(`🚨 EMERGENCY SOS triggered by ${userName} at ${emergencyTime}`);

    const notifications = [];

    // Send email notifications to emergency contacts with email addresses
    for (const contact of userProfile.emergency_contacts) {
      if (contact.email) {
        try {
          const emailResponse = await resend.emails.send({
            from: "LifeLink Sync Emergency <emergency@resend.dev>",
            to: [contact.email],
            subject: `🚨 EMERGENCY ALERT - ${userName} needs immediate assistance`,
            html: `
              <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif;">
                <h1 style="color: white; text-align: center; margin: 0 0 20px 0;">🚨 EMERGENCY SOS ALERT 🚨</h1>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: white; margin: 0 0 10px 0;">Emergency Details:</h2>
                  <p><strong>Person:</strong> ${userName}</p>
                  <p><strong>Time:</strong> ${emergencyTime}</p>
                  <p><strong>Location:</strong> ${location}</p>
                  <p><strong>Your Relationship:</strong> ${contact.relationship}</p>
                </div>

                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: white; margin: 0 0 10px 0;">IMMEDIATE ACTION REQUIRED:</h3>
                  <ol style="color: white; line-height: 1.6;">
                    <li><strong>Call ${userName} immediately: ${contact.phone}</strong></li>
                    <li>If no response, contact local emergency services</li>
                    <li>Check their last known location if possible</li>
                    <li>Contact other emergency contacts if needed</li>
                  </ol>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                  <p style="font-size: 18px; font-weight: bold; color: white;">⚠️ This is an automated emergency alert ⚠️</p>
                  <p style="color: white;">Sent by LifeLink Sync Emergency Protection System</p>
                </div>

                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 20px;">
                  <p style="font-size: 12px; color: white; margin: 0; text-align: center;">
                    If this is a false alarm, please contact ${userName} to confirm their safety.
                  </p>
                </div>
              </div>
            `,
          });

          notifications.push({
            contact: contact.name,
            email: contact.email,
            status: "sent",
            response: emailResponse
          });

          console.log(`✅ Emergency email sent to ${contact.name} (${contact.email})`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${contact.name}:`, emailError);
          notifications.push({
            contact: contact.name,
            email: contact.email,
            status: "failed",
            error: emailError.message
          });
        }
      } else {
        // Log contacts without email for SMS future implementation
        notifications.push({
          contact: contact.name,
          phone: contact.phone,
          status: "phone_only",
          message: "SMS notification not yet implemented"
        });
      }
    }

    // Log emergency event for records
    console.log(`📋 Emergency SOS Summary:
      - User: ${userName}
      - Time: ${emergencyTime}
      - Contacts notified: ${notifications.filter(n => n.status === 'sent').length}
      - Failed notifications: ${notifications.filter(n => n.status === 'failed').length}
      - Phone-only contacts: ${notifications.filter(n => n.status === 'phone_only').length}
    `);

    return new Response(JSON.stringify({
      success: true,
      message: "Emergency notifications sent",
      notifications,
      summary: {
        total_contacts: userProfile.emergency_contacts.length,
        emails_sent: notifications.filter(n => n.status === 'sent').length,
        failed_emails: notifications.filter(n => n.status === 'failed').length,
        phone_only: notifications.filter(n => n.status === 'phone_only').length
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("🚨 Emergency SOS function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        message: "Emergency notification system encountered an error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);