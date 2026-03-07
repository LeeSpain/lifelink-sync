/**
 * record-location-ping
 * Auth: user JWT
 * Inserts a location ping and upserts live presence.
 * Realtime: rely on Supabase Realtime table broadcasts for `live_presence`.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    const { lat, lng, accuracy, speed, battery } = body ?? {};
    if (
      typeof lat !== "number" || typeof lng !== "number" ||
      isNaN(lat) || isNaN(lng)
    ) {
      return new Response(JSON.stringify({ error: "Invalid lat/lng" }), { 
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    // Get user from JWT
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { 
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }
    const user_id = userData.user.id;

    console.log(`📍 Recording location for user ${user_id}: ${lat}, ${lng}`);

    // Insert ping
    const { error: pingErr } = await supabase.from("location_pings").insert({
      user_id, 
      lat, 
      lng, 
      accuracy: accuracy ?? null, 
      speed: speed ?? null, 
      battery: battery ?? null, 
      source: "mobile"
    });
    if (pingErr) {
      console.error("Error inserting ping:", pingErr);
      throw pingErr;
    }

    // Upsert live presence
    const { error: upsertErr } = await supabase.from("live_presence").upsert({
      user_id, 
      lat, 
      lng, 
      last_seen: new Date().toISOString(), 
      battery: battery ?? null, 
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (upsertErr) {
      console.error("Error upserting presence:", upsertErr);
      throw upsertErr;
    }

    // Optionally call detect-place-events (fire-and-forget)
    const placeEndpoint = Deno.env.get("DETECT_PLACE_EVENTS_URL");
    if (placeEndpoint) {
      fetch(placeEndpoint, { 
        method: "POST", 
        headers: { 
          "content-type": "application/json", 
          "x-internal": "1" 
        }, 
        body: JSON.stringify({ user_id, lat, lng }) 
      }).catch((err) => {
        console.warn("Failed to call place detection:", err);
      });
    }

    console.log(`✅ Location recorded successfully for user ${user_id}`);

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  } catch (e) {
    console.error("Location ping error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { 
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});