// Conference Status Webhook
// Tracks real-time conference events: start, end, join, leave, mute, hold

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function parseFormData(req: Request): Promise<Record<string, string>> {
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

  return {};
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const data = await parseFormData(req);

    console.log("📡 Conference status webhook:", data);

    const {
      ConferenceSid,
      FriendlyName,
      StatusCallbackEvent,
      CallSid,
      Muted,
      Hold,
      Coaching,
      SequenceNumber,
    } = data;

    const event = StatusCallbackEvent?.toLowerCase();

    if (!event) {
      return new Response(
        JSON.stringify({ error: "No event type provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle conference-level events
    if (event === "conference-start") {
      console.log("🚀 Conference started:", FriendlyName);

      await supabase
        .from("emergency_conferences")
        .update({
          conference_sid: ConferenceSid,
          started_at: new Date().toISOString(),
          status: "active",
        })
        .eq("conference_name", FriendlyName);
    }

    if (event === "conference-end") {
      console.log("🏁 Conference ended:", FriendlyName);

      await supabase
        .from("emergency_conferences")
        .update({
          ended_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("conference_name", FriendlyName);
    }

    // Handle participant-level events
    if (event === "participant-join") {
      console.log("👤 Participant joined:", CallSid);

      const { data: participant } = await supabase
        .from("conference_participants")
        .select("*")
        .eq("call_sid", CallSid)
        .single();

      if (participant) {
        await supabase
          .from("conference_participants")
          .update({
            status: "in_conference",
            joined_at: new Date().toISOString(),
          })
          .eq("call_sid", CallSid);

        // If this is the user joining, update conference
        if (participant.participant_type === "user") {
          const { data: conference } = await supabase
            .from("emergency_conferences")
            .select("*")
            .eq("id", participant.conference_id)
            .single();

          if (conference) {
            await supabase
              .from("emergency_conferences")
              .update({ user_joined_at: new Date().toISOString() })
              .eq("id", conference.id);
          }
        }
      }
    }

    if (event === "participant-leave") {
      console.log("👋 Participant left:", CallSid);

      const { data: participant } = await supabase
        .from("conference_participants")
        .select("*")
        .eq("call_sid", CallSid)
        .single();

      if (participant) {
        const leftAt = new Date();
        const duration = participant.joined_at
          ? Math.floor((leftAt.getTime() - new Date(participant.joined_at).getTime()) / 1000)
          : null;

        await supabase
          .from("conference_participants")
          .update({
            status: "left",
            left_at: leftAt.toISOString(),
            duration_seconds: duration,
          })
          .eq("call_sid", CallSid);
      }
    }

    if (event === "participant-mute" || event === "participant-unmute") {
      const isMuted = Muted === "true";
      console.log(`🔇 Participant ${isMuted ? "muted" : "unmuted"}:`, CallSid);

      await supabase
        .from("conference_participants")
        .update({ muted: isMuted })
        .eq("call_sid", CallSid);
    }

    if (event === "participant-hold" || event === "participant-unhold") {
      const isHeld = Hold === "true";
      console.log(`⏸️  Participant ${isHeld ? "on hold" : "off hold"}:`, CallSid);

      await supabase
        .from("conference_participants")
        .update({ hold: isHeld })
        .eq("call_sid", CallSid);
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Conference status webhook error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
