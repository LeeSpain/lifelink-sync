// Emergency SOS with Conference Bridge
// New version that creates live conference instead of sequential calls

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyContact {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface EmergencySOSRequest {
  userProfile: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    emergency_contacts: EmergencyContact[];
  };
  location: string;
  locationData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    googleMapsLink: string;
  };
  timestamp: string;
  useConference?: boolean; // Toggle between old/new system
}

function getUserSupabaseClient(req: Request) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

function getServiceSupabaseClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email to", to);
    return { skipped: true };
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "LifeLink Sync <noreply@lifelink-sync.com>",
      to: [to],
      subject,
      html,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(`Resend error: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = getUserSupabaseClient(req);
    const supabaseService = getServiceSupabaseClient();
    const body = await req.json() as EmergencySOSRequest;

    // Get authenticated user
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authedUserId = userData.user.id;
    console.log("🚨 Emergency SOS triggered for user:", authedUserId);

    const contacts = (body.userProfile?.emergency_contacts || []).filter(
      (c) => c && (c.email || c.phone)
    );

    if (!contacts.length) {
      return new Response(
        JSON.stringify({ error: "No emergency contacts configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = `${body.userProfile?.first_name || ""} ${body.userProfile?.last_name || ""}`.trim() || "your contact";

    // Create SOS incident
    const { data: incident, error: incErr } = await supabaseUser
      .from("sos_incidents")
      .insert({
        user_id: authedUserId,
        location: body.location || null,
        triggered_via: "app",
      })
      .select("id, contact_emails_sent, calls_initiated, status")
      .single();

    if (incErr || !incident) {
      throw new Error("Could not create SOS incident");
    }

    const incidentId = incident.id as string;
    console.log("✅ SOS incident created:", incidentId);

    // Send emergency emails
    let emailsSent = 0;
    for (const c of contacts) {
      if (c.email) {
        try {
          const locationInfo = body.locationData
            ? `${body.location}<br><br><strong>📍 <a href="${body.locationData.googleMapsLink}" target="_blank" style="color: #ef4444; text-decoration: none;">View on Google Maps →</a></strong><br><small>Coordinates: ${body.locationData.latitude.toFixed(6)}, ${body.locationData.longitude.toFixed(6)}${body.locationData.accuracy ? ` (±${Math.round(body.locationData.accuracy)}m accuracy)` : ""}</small>`
            : body.location;

          const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
              <h2 style="color: #ef4444; margin-top: 0;">🚨 EMERGENCY ALERT</h2>
              <p style="font-size: 18px; font-weight: bold;">Emergency SOS activated for <strong>${userName}</strong></p>

              <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #dc2626; margin-top: 0;">📍 Location Information:</h3>
                <p style="margin: 10px 0; font-size: 16px;">${locationInfo}</p>
              </div>

              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">⏰ Alert Details:</h3>
                <p><strong>Time:</strong> ${new Date(body.timestamp).toLocaleString()}</p>
                <p><strong>Contact:</strong> ${userName}</p>
              </div>

              <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">⚠️ You will receive a phone call to join the emergency conference. Please answer to assist.</p>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Sent by LifeLink Sync Emergency System
              </p>
            </div>
          `;

          await sendEmail(c.email, `🚨 EMERGENCY ALERT - ${userName} needs help`, emailHTML);
          emailsSent++;
        } catch (e) {
          console.error("Email send failed for", c.email, e);
        }
      }
    }

    if (emailsSent > 0) {
      await supabaseUser
        .from("sos_incidents")
        .update({ contact_emails_sent: emailsSent, status: "in_progress" })
        .eq("id", incidentId);
    }

    console.log(`✅ ${emailsSent} emergency emails sent`);

    // Check if conference mode is enabled
    const useConference = body.useConference !== false; // Default to true

    if (useConference) {
      console.log("📞 Initiating emergency conference...");

      // Get user's phone number from profile
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("phone")
        .eq("user_id", authedUserId)
        .single();

      const userPhone = body.userProfile?.phone || profile?.phone;

      if (!userPhone) {
        console.warn("⚠️ No user phone number, skipping conference");
      } else {
        // Call the conference function
        try {
          const conferenceResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/emergency-conference`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: req.headers.get("authorization") || "",
              },
              body: JSON.stringify({
                incidentId,
                userId: authedUserId,
                userPhone,
                userName,
                location: body.location,
                locationData: body.locationData,
                emergencyContacts: contacts,
              }),
            }
          );

          if (conferenceResponse.ok) {
            const conferenceData = await conferenceResponse.json();
            console.log("✅ Emergency conference initiated:", conferenceData);

            return new Response(
              JSON.stringify({
                success: true,
                mode: "conference",
                incident_id: incidentId,
                emails_sent: emailsSent,
                conference: conferenceData.conference,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            const error = await conferenceResponse.text();
            console.error("❌ Conference creation failed:", error);
            // Fall through to return success anyway (emails were sent)
          }
        } catch (error) {
          console.error("❌ Conference call failed:", error);
          // Continue - at least emails were sent
        }
      }
    }

    // Legacy mode or conference failed - return success with emails
    return new Response(
      JSON.stringify({
        success: true,
        mode: "email_only",
        incident_id: incidentId,
        emails_sent: emailsSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Emergency SOS error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
