/**
 * detect-place-events
 * Auth: service role / internal
 * Computes enter/exit transitions for a user's circles and inserts place_events.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const xInternal = req.headers.get("x-internal");
    if (!xInternal) return new Response("Forbidden", { status: 403 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { 
      auth: { persistSession: false } 
    });
    const { user_id, lat, lng } = await req.json();

    if (!user_id || typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "Missing payload" }), { 
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    console.log(`🔍 Checking place events for user ${user_id} at ${lat}, ${lng}`);

    // Load family groups for this user
    const { data: groups, error: gErr } = await supabase
      .from("family_memberships").select("group_id").eq("user_id", user_id);
    if (gErr) throw gErr;
    const groupIds = [...new Set(groups?.map(g => g.group_id) ?? [])];
    if (groupIds.length === 0) {
      console.log(`📭 No family groups found for user ${user_id}`);
      return new Response(JSON.stringify({ events_created: 0 }), { 
        headers: { ...corsHeaders, "content-type": "application/json" } 
      });
    }

    // Load places for these groups
    const { data: places, error: pErr } = await supabase
      .from("places").select("id, family_group_id, name, lat, lng, radius_m").in("family_group_id", groupIds);
    if (pErr) throw pErr;

    let created = 0;

    // For each place, check last state and create transition if needed
    for (const place of places ?? []) {
      const distance = haversine(lat, lng, place.lat, place.lng);
      const inside = distance <= (place.radius_m ?? 150);

      console.log(`🏠 Place ${place.name}: distance=${Math.round(distance)}m, inside=${inside}`);

      // Find last event for this user/place to infer last state
      const { data: lastEvent, error: leErr } = await supabase
        .from("place_events")
        .select("event")
        .eq("user_id", user_id)
        .eq("place_id", place.id)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (leErr) throw leErr;

      const lastStateInside = lastEvent?.event === "enter" ? true :
                              lastEvent?.event === "exit" ? false : null;

      let transition: "enter" | "exit" | null = null;
      if (lastStateInside === null) {
        // No history: create an "enter" only if currently inside to seed state
        transition = inside ? "enter" : null;
      } else if (inside !== lastStateInside) {
        transition = inside ? "enter" : "exit";
      }

      if (transition) {
        console.log(`📌 Creating ${transition} event for ${place.name}`);
        const { error: insErr } = await supabase.from("place_events").insert({
          user_id,
          place_id: place.id,
          event: transition,
          occurred_at: new Date().toISOString()
        });
        if (insErr) throw insErr;
        created += 1;
      }
    }

    console.log(`✅ Created ${created} place events for user ${user_id}`);

    return new Response(JSON.stringify({ events_created: created }), { 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  } catch (e) {
    console.error("Place detection error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { 
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});