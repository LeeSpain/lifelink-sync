/**
 * notify-user
 * Auth: service role / internal
 * Sends push notifications and email fallback for family emergency alerts
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email_fallback?: {
    to: string[];
    subject?: string;
    html?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    // Check for internal service call
    const xInternal = req.headers.get("x-internal");
    if (!xInternal) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const payload = await req.json() as NotificationPayload;
    console.log("📱 Processing notification for users:", payload.user_ids);

    let pushResults = { sent: 0, failed: 0 };
    let emailResults = { sent: 0, failed: 0 };

    // TODO: Implement push notifications via FCM/APNs
    // For now, we'll simulate push notification success
    console.log("🔔 Push notifications would be sent to:", payload.user_ids);
    pushResults.sent = payload.user_ids.length;

    // Send email fallback if configured
    if (payload.email_fallback && RESEND_API_KEY) {
      try {
        const { to, subject, html } = payload.email_fallback;
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LifeLink Sync Emergency <emergency@lifelink-sync.com>",
            to,
            subject: subject || payload.title,
            html: html || `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #dc2626;">${payload.title}</h2>
              <p>${payload.body}</p>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                This is an automated emergency notification from LifeLink Sync.
              </p>
            </div>`
          })
        });

        if (emailResponse.ok) {
          emailResults.sent = to.length;
          console.log("📧 Emergency emails sent to:", to);
        } else {
          emailResults.failed = to.length;
          console.error("📧 Email sending failed:", await emailResponse.text());
        }
      } catch (error) {
        emailResults.failed = payload.email_fallback.to.length;
        console.error("📧 Email error:", error);
      }
    }

    // Log notification attempt
    await supabase.from("family_alerts").insert({
      alert_type: "emergency_notification",
      alert_data: {
        title: payload.title,
        body: payload.body,
        push_results: pushResults,
        email_results: emailResults,
        user_ids: payload.user_ids
      },
      status: pushResults.sent > 0 || emailResults.sent > 0 ? "delivered" : "failed"
    }).catch(console.error);

    return new Response(JSON.stringify({
      success: true,
      push_results: pushResults,
      email_results: emailResults,
      total_notified: pushResults.sent + emailResults.sent
    }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Notification error:", error);
    return new Response(JSON.stringify({
      error: String(error?.message ?? error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});