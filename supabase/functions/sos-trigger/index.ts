// SOS Trigger — server-to-server edge function
// Called by device integrations (Flic, Alexa, Google Home, BLE pendant)
// that cannot provide a user JWT. Uses service role + API key validation.
//
// Creates sos_incidents, sends Resend emails, initiates Twilio calls.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-integration-key",
};

interface EmergencyContact {
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface SOSTriggerRequest {
  user_id: string;
  source: "alexa" | "google_home" | "ble_pendant" | "flic_hold" | "voice";
  lat?: number;
  lng?: number;
}

function toForm(data: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
    else if (v !== undefined) params.append(k, v);
  });
  return params;
}

async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email to", to);
    return { skipped: true } as const;
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

async function makeTwilioCall(
  contact: EmergencyContact,
  incidentId: string,
  order: number,
  userName: string,
  location: string,
  supabase: ReturnType<typeof createClient>,
) {
  const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM) {
    console.warn("Twilio secrets missing, simulating call for", contact.phone);
    await supabase.from("sos_call_attempts").insert({
      incident_id: incidentId,
      attempt_order: order,
      contact_name: contact.name || null,
      contact_phone: contact.phone || null,
      contact_email: contact.email || null,
      status: "simulated",
    });
    return { simulated: true } as const;
  }

  const statusCallbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-status-webhook`;

  let locationMessage = location;
  if (location.includes("Lat:") && location.includes("Lng:")) {
    const latMatch = location.match(/Lat:\s*([-\d.]+)/);
    const lngMatch = location.match(/Lng:\s*([-\d.]+)/);
    if (latMatch && lngMatch) {
      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);
      locationMessage = `coordinates latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)}`;
    }
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Emergency alert! This is an urgent message for ${userName}. They have activated their emergency S.O.S. system. Their last known location is: ${locationMessage}. Please check on them immediately or call them back. If you cannot reach them, consider contacting emergency services. Press any key to acknowledge this message.</Say>
  <Pause length="3"/>
  <Say>Repeating: Emergency alert for ${userName}. Check their location and contact them immediately.</Say>
</Response>`;

  const body = toForm({
    To: contact.phone!,
    From: FROM,
    Twiml: twiml,
    StatusCallback: statusCallbackUrl,
    StatusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });

  const auth = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Twilio call error: ${resp.status} ${JSON.stringify(data)}`);

  const callSid = data.sid as string | undefined;
  await supabase.from("sos_call_attempts").insert({
    incident_id: incidentId,
    attempt_order: order,
    contact_name: contact.name || null,
    contact_phone: contact.phone || null,
    contact_email: contact.email || null,
    call_sid: callSid || null,
    status: "queued",
  });
  return { callSid } as const;
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate integration API key
    const integrationKey = req.headers.get("x-integration-key") || "";
    const expectedKey = Deno.env.get("INTEGRATION_API_KEY") || "";
    if (!expectedKey || integrationKey !== expectedKey) {
      console.error("Invalid or missing X-Integration-Key");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as SOSTriggerRequest;
    if (!body.user_id || !body.source) {
      return new Response(JSON.stringify({ error: "user_id and source are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`SOS trigger: source=${body.source}, user=${body.user_id}`);

    // Use service role — this function is called server-to-server
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Load user profile + emergency contacts
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, emergency_contacts")
      .eq("user_id", body.user_id)
      .maybeSingle();

    if (profileErr || !profile) {
      console.error("Profile not found for user", body.user_id, profileErr);
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contacts: EmergencyContact[] = (
      Array.isArray(profile.emergency_contacts) ? profile.emergency_contacts : []
    ).filter((c: EmergencyContact) => c && (c.email || c.phone));

    if (!contacts.length) {
      return new Response(JSON.stringify({ error: "No emergency contacts configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "your contact";

    // Build location string
    let location = "Location unavailable";
    let googleMapsLink = "";
    if (body.lat && body.lng) {
      googleMapsLink = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
      location = `Lat: ${body.lat.toFixed(6)}, Lng: ${body.lng.toFixed(6)}`;
    }

    // Create sos_incidents record
    const { data: incident, error: incErr } = await supabase
      .from("sos_incidents")
      .insert({
        user_id: body.user_id,
        location: location,
        triggered_via: body.source,
      })
      .select("id")
      .single();

    if (incErr || !incident) {
      console.error("Failed to create incident", incErr);
      throw new Error("Could not create SOS incident");
    }

    const incidentId = incident.id as string;
    console.log(`SOS incident created: ${incidentId}`);

    // Send emails
    let emailsSent = 0;
    for (const c of contacts) {
      if (!c.email) continue;
      try {
        const locationInfo = googleMapsLink
          ? `${location}<br><br><strong><a href="${googleMapsLink}" target="_blank" style="color: #ef4444;">View on Google Maps</a></strong>`
          : location;

        const sourceLabel = {
          alexa: "Amazon Alexa voice command",
          google_home: "Google Home voice command",
          ble_pendant: "Bluetooth pendant alert",
          flic_hold: "Flic button long press",
          voice: "Voice command",
        }[body.source] || body.source;

        const emailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
            <h2 style="color: #ef4444; margin-top: 0;">EMERGENCY ALERT</h2>
            <p style="font-size: 18px; font-weight: bold;">Emergency SOS activated for <strong>${userName}</strong></p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Location:</h3>
              <p style="margin: 10px 0; font-size: 16px;">${locationInfo}</p>
            </div>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Triggered via:</strong> ${sourceLabel}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">This is an automated emergency alert. Please check on ${userName} immediately.</p>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Sent by LifeLink Sync Emergency System</p>
          </div>`;

        await sendEmail(c.email, `EMERGENCY ALERT - ${userName} needs help`, emailHTML);
        emailsSent++;
      } catch (e) {
        console.error("Email send failed for", c.email, e);
      }
    }

    if (emailsSent > 0) {
      await supabase
        .from("sos_incidents")
        .update({ contact_emails_sent: emailsSent, status: "in_progress" })
        .eq("id", incidentId);
    }

    // Make Twilio calls sequentially
    let callsInitiated = 0;
    let order = 1;
    for (const c of contacts) {
      if (!c.phone) continue;
      try {
        await makeTwilioCall(c, incidentId, order, userName, location, supabase);
        callsInitiated++;
        order++;
      } catch (e) {
        console.error("Twilio call failed for", c.phone, e);
        await supabase.from("sos_call_attempts").insert({
          incident_id: incidentId,
          attempt_order: order,
          contact_name: c.name || null,
          contact_phone: c.phone || null,
          status: "failed",
          error: String((e as Error)?.message || e),
        });
        order++;
      }

      // Wait and check if someone answered
      await wait(15000);
      const { data: attempts } = await supabase
        .from("sos_call_attempts")
        .select("status")
        .eq("incident_id", incidentId);
      const anyAnswered = (attempts || []).some((a: { status: string }) => a.status === "answered");
      if (anyAnswered) break;
    }

    // Finalize
    await supabase
      .from("sos_incidents")
      .update({
        calls_initiated: callsInitiated,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", incidentId);

    const summary = {
      incident_id: incidentId,
      source: body.source,
      emails_sent: emailsSent,
      calls_initiated: callsInitiated,
    };
    console.log("SOS trigger complete:", summary);

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sos-trigger error:", error);
    return new Response(
      JSON.stringify({ error: String((error as Error)?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
