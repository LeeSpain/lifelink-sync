// Enhanced Emergency SOS Edge Function
// - Creates sos_incidents record
// - Sends emails to contacts via Resend
// - Initiates sequential Twilio calls and records sos_call_attempts
// - Uses user JWT context so RLS applies to inserts/updates

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyContact {
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface EmergencySOSRequest {
  userProfile: {
    first_name?: string;
    last_name?: string;
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
}

function getUserSupabaseClient(req: Request) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
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

function toForm(data: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
    else if (v !== undefined) params.append(k, v);
  });
  return params;
}

async function makeTwilioCall(contact: EmergencyContact, incidentId: string, order: number, userName: string, location: string, supabaseUser: ReturnType<typeof createClient>) {
  const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM) {
    console.warn("Twilio secrets missing, simulating call for", contact.phone);
    const { data: callAttempt, error: insErr } = await supabaseUser
      .from("sos_call_attempts")
      .insert({
        incident_id: incidentId,
        attempt_order: order,
        contact_name: contact.name || null,
        contact_phone: contact.phone || null,
        contact_email: contact.email || null,
        status: "simulated",
      })
      .select("id")
      .maybeSingle();
    if (insErr) console.error("Insert simulated call attempt failed", insErr);
    return { simulated: true, callAttemptId: callAttempt?.id } as const;
  }

  const statusCallbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-status-webhook`;
  
  // Enhanced location message for voice calls
  let locationMessage = location;
  if (location.includes('Lat:') && location.includes('Lng:')) {
    // Extract coordinates for better voice pronunciation
    const latMatch = location.match(/Lat:\s*([-\d.]+)/);
    const lngMatch = location.match(/Lng:\s*([-\d.]+)/);
    if (latMatch && lngMatch) {
      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);
      locationMessage = `coordinates latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)}. ${location.includes('(') ? location.split('(')[0].trim() : ''}`;
    }
  }
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="Polly.Joanna">Emergency alert! This is an urgent message for ${userName}. They have activated their emergency S.O.S. system. Their last known location is: ${locationMessage}. Please check on them immediately or call them back. If you cannot reach them, consider contacting emergency services. Press any key to acknowledge this message.</Say>\n  <Pause length="3"/>\n  <Say>Repeating: Emergency alert for ${userName}. Check their location and contact them immediately.</Say>\n</Response>`;

  const body = toForm({
    To: contact.phone!,
    From: FROM,
    Twiml: twiml,
    StatusCallback: statusCallbackUrl,
    // Twilio expects multiple entries for this key
    StatusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });

  const auth = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);
  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Twilio call error: ${resp.status} ${JSON.stringify(data)}`);

  const callSid = data.sid as string | undefined;
  const { error: insErr } = await supabaseUser.from("sos_call_attempts").insert({
    incident_id: incidentId,
    attempt_order: order,
    contact_name: contact.name || null,
    contact_phone: contact.phone || null,
    contact_email: contact.email || null,
    call_sid: callSid || null,
    status: "queued",
  });
  if (insErr) console.error("Insert call attempt failed", insErr);
  return { callSid } as const;
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUser = getUserSupabaseClient(req);
    const body = (await req.json()) as EmergencySOSRequest;

    // Resolve authenticated user for RLS-bound inserts
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("No authenticated user in request", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authedUserId = userData.user.id;
    console.log("Creating SOS incident for user:", authedUserId);

    const contacts = (body.userProfile?.emergency_contacts || []).filter(c => c && (c.email || c.phone));
    if (!contacts.length) {
      return new Response(JSON.stringify({ error: "No emergency contacts configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Derive user full name for messages
    const userName = `${body.userProfile?.first_name || ""} ${body.userProfile?.last_name || ""}`.trim() || "your contact";

    // Create incident under user's RLS context
    const { data: incident, error: incErr } = await supabaseUser
      .from("sos_incidents")
      .insert({ user_id: authedUserId, location: body.location || null, triggered_via: "app" })
      .select("id, contact_emails_sent, calls_initiated, status")
      .single();

    if (incErr || !incident) {
      console.error("Failed to create incident", incErr);
      throw new Error("Could not create SOS incident");
    }

    const incidentId = incident.id as string;

    // Send emails (best-effort)
    let emailsSent = 0;
    for (const c of contacts) {
      if (c.email) {
        try {
          const locationInfo = body.locationData 
            ? `${body.location}<br><br><strong>📍 <a href="${body.locationData.googleMapsLink}" target="_blank" style="color: #ef4444; text-decoration: none;">View on Google Maps →</a></strong><br><small>Coordinates: ${body.locationData.latitude.toFixed(6)}, ${body.locationData.longitude.toFixed(6)}${body.locationData.accuracy ? ` (±${Math.round(body.locationData.accuracy)}m accuracy)` : ''}</small>`
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
                <p style="margin: 0; font-weight: bold; color: #991b1b;">⚠️ This is an automated emergency alert. Please check on ${userName} immediately.</p>
              </div>
              
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Sent by LifeLink Sync Emergency System
              </p>
            </div>
          `;

          await sendEmail(
            c.email,
            `🚨 EMERGENCY ALERT - ${userName} needs help`,
            emailHTML
          );
          emailsSent++;
        } catch (e) {
          console.error("Email send failed for", c.email, e);
        }
      }
    }

    if (emailsSent > 0) {
      const { error: updErr } = await supabaseUser
        .from("sos_incidents")
        .update({ contact_emails_sent: emailsSent, status: "in_progress" })
        .eq("id", incidentId);
      if (updErr) console.warn("Failed to update incident emails count", updErr);
    }

    // Determine routing path based on subscriber tier or explicit request
    let callsInitiated = 0;
    let order = 1;

    // Try to detect regional call centre entitlement from subscriber record
    let route: 'call_center' | 'contacts' = 'contacts';
    try {
      const { data: subscriber } = await supabaseUser
        .from('subscribers')
        .select('subscription_tier, subscribed')
        .eq('user_id', authedUserId)
        .maybeSingle();
      const tier = (subscriber?.subscription_tier || '').toLowerCase();
      if (tier.includes('call centre') || tier.includes('call center')) {
        route = 'call_center';
      }
    } catch (e) {
      console.warn('Subscriber lookup failed, defaulting to contacts route');
    }

    // Allow explicit override via request body (optional), but gate by secret
    const bodyAny: any = body as any;
    const callCenterEnabled = (Deno.env.get("CALL_CENTER_ENABLED") || "").toLowerCase() === "true";
    if (callCenterEnabled && bodyAny?.route === 'call_center') route = 'call_center';
    // Final safety: if secret not enabled, force contacts
    if (!callCenterEnabled) route = 'contacts';

    if (route === 'call_center') {
      // Regional Call Centre path: call the call centre only (no phone calls to contacts), but still emailed above
      const rawNumber = (bodyAny?.callCenterNumber as string) || '0034643706877';
      const callCenterNumber = rawNumber.trim().replace(/^00/, '+').replace(/[^+\d]/g, '');
      const callCenterContact: EmergencyContact = { name: 'Regional Call Center (Spain)', phone: callCenterNumber };

      const maxRetries = 3;
      const waitBetweenAttemptsMs = 20000; // 20 seconds between attempts

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await makeTwilioCall(callCenterContact, incidentId, order, userName, body.location, supabaseUser);
          callsInitiated++;
          order++;
        } catch (e) {
          console.error('Call center Twilio call failed', e);
          await supabaseUser.from('sos_call_attempts').insert({
            incident_id: incidentId,
            attempt_order: order,
            contact_name: callCenterContact.name || null,
            contact_phone: callCenterContact.phone || null,
            status: 'failed',
            error: String(e?.message || e),
          });
          order++;
        }

        // Wait and check if answered before retrying
        await wait(waitBetweenAttemptsMs);
        const { data: ccAttempts } = await supabaseUser
          .from('sos_call_attempts')
          .select('status')
          .eq('incident_id', incidentId)
          .eq('contact_phone', callCenterNumber);
        const answered = (ccAttempts || []).some((a: any) => a.status === 'answered');
        if (answered) break;
      }
    } else {
      // Premium path: sequentially call contacts in order; stop if one answers
      const waitBetweenCallsMs = 15000; // 15 seconds
      for (const c of contacts) {
        if (!c.phone) continue;
        try {
          await makeTwilioCall(c, incidentId, order, userName, body.location, supabaseUser);
          callsInitiated++;
          order++;
        } catch (e) {
          console.error('Twilio call failed for', c.phone, e);
          await supabaseUser.from('sos_call_attempts').insert({
            incident_id: incidentId,
            attempt_order: order,
            contact_name: c.name || null,
            contact_phone: c.phone || null,
            contact_email: c.email || null,
            status: 'failed',
            error: String(e?.message || e),
          });
          order++;
        }

        // Wait and check if someone already answered to stop further calls
        await wait(waitBetweenCallsMs);
        const { data: attempts } = await supabaseUser
          .from('sos_call_attempts')
          .select('status')
          .eq('incident_id', incidentId);
        const anyAnswered = (attempts || []).some((a: any) => a.status === 'answered');
        if (anyAnswered) break;
      }
    }

    // Finalize incident with call count
    const { error: finalUpdErr } = await supabaseUser
      .from('sos_incidents')
      .update({ calls_initiated: callsInitiated, status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', incidentId);
    if (finalUpdErr) console.warn('Failed to finalize incident', finalUpdErr);

    const summary = { emails_sent: emailsSent, calls_initiated: callsInitiated, incident_id: incidentId, route };
    return new Response(JSON.stringify({ ok: true, summary }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Emergency SOS enhanced error:", error);
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
