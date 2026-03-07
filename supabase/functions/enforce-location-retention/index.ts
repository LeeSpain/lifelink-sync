/**
 * enforce-location-retention
 * Auth: service role (cron)
 * Deletes location_pings older than 30 days.
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
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    
    const xCron = req.headers.get("x-cron") || req.headers.get("X-Cron");
    if (!xCron) return new Response("Forbidden", { status: 403 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { 
      auth: { persistSession: false } 
    });

    console.log("🧹 Starting location data cleanup...");

    // Delete location pings older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    
    const { error: delErr, count } = await supabase
      .from("location_pings")
      .delete({ count: 'exact' })
      .lt("captured_at", thirtyDaysAgo);

    if (delErr) {
      console.error("Location cleanup error:", delErr);
      throw delErr;
    }

    console.log(`✅ Deleted ${count || 0} old location pings`);

    return new Response(JSON.stringify({ 
      ok: true, 
      deleted_count: count || 0,
      cutoff_date: thirtyDaysAgo
    }), { 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  } catch (e) {
    console.error("Retention cleanup error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { 
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});