// Twilio Status Webhook - updates sos_call_attempts and sos_incidents
// Public endpoint (JWT disabled via config.toml)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

async function parseBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    params.forEach((value, key) => (result[key] = value));
    return result;
  }
  if (contentType.includes("application/json")) {
    return await req.json();
  }
  // fallback
  const text = await req.text();
  try { return JSON.parse(text); } catch { return {}; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await parseBody(req);
    const CallSid = body["CallSid"] || body["call_sid"];
    const CallStatus = body["CallStatus"] || body["call_status"];
    const Duration = body["CallDuration"] || body["Duration"] || body["duration"];

    if (!CallSid && !body["To"]) {
      return new Response(JSON.stringify({ error: "Missing identifiers" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = getServiceClient();

    // Update call attempt by CallSid
    const updates: Record<string, any> = { status: CallStatus || "unknown", ended_at: new Date().toISOString() };
    if (Duration) updates.duration_seconds = Number(Duration);

    const { data: attempt, error: updErr } = await supabase
      .from("sos_call_attempts")
      .update(updates)
      .eq("call_sid", CallSid)
      .select("id, incident_id")
      .maybeSingle();

    if (updErr) {
      console.error("Failed updating call attempt", updErr);
    }

    const incidentId = attempt?.incident_id as string | undefined;

    if (incidentId) {
      // If all attempts are in a terminal state, mark incident completed
      const { data: remaining, error: remErr } = await supabase
        .from("sos_call_attempts")
        .select("id, status")
        .eq("incident_id", incidentId);

      if (remErr) {
        console.warn("Check remaining attempts failed", remErr);
      } else if (remaining && remaining.length > 0) {
        const open = remaining.some(r => ["queued", "initiated", "ringing"].includes((r as any).status));
        if (!open) {
          const { error: finErr } = await supabase
            .from("sos_incidents")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", incidentId);
          if (finErr) console.warn("Finalize incident failed", finErr);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Twilio webhook error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
