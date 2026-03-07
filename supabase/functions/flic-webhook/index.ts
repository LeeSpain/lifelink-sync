import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlicWebhookBody {
  owner_user: string; // UUID of the owner (required)
  flic_uuid: string; // Unique identifier of the Flic button (required)
  name?: string; // Optional friendly name
  event?: string; // e.g., 'single', 'double', 'hold'
  voltage?: number; // Optional battery voltage
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    { auth: { persistSession: false } }
  );

  try {
    const body = (await req.json()) as FlicWebhookBody;

    if (!body || !body.owner_user || !body.flic_uuid) {
      return new Response(
        JSON.stringify({ error: "owner_user and flic_uuid are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📩 Flic webhook received:", body);

    // Find existing button for this user + uuid
    const { data: existingButtons, error: findErr } = await supabase
      .from("devices_flic_buttons")
      .select("id")
      .eq("owner_user", body.owner_user)
      .eq("flic_uuid", body.flic_uuid)
      .limit(1);

    if (findErr) throw findErr;

    let buttonId: string | null = existingButtons?.[0]?.id ?? null;

    if (!buttonId) {
      // Create new button record
      const { data: inserted, error: insertErr } = await supabase
        .from("devices_flic_buttons")
        .insert({
          owner_user: body.owner_user,
          flic_uuid: body.flic_uuid,
          name: body.name ?? null,
          last_voltage: body.voltage ?? null,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      buttonId = inserted.id;
      console.log("✅ Created new Flic button record", { buttonId });
    } else if (body.name || typeof body.voltage === "number") {
      // Update metadata if provided
      const { error: updateErr } = await supabase
        .from("devices_flic_buttons")
        .update({
          name: body.name ?? undefined,
          last_voltage: typeof body.voltage === "number" ? body.voltage : undefined,
        })
        .eq("id", buttonId);
      if (updateErr) throw updateErr;
      console.log("🔄 Updated Flic button metadata", { buttonId });
    }

    // Log event if provided
    if (buttonId && body.event) {
      const { error: eventErr } = await supabase
        .from("devices_flic_events")
        .insert({ button_id: buttonId, event: body.event });
      if (eventErr) throw eventErr;
      console.log("📝 Logged Flic event", { buttonId, event: body.event });
    }

    return new Response(
      JSON.stringify({ success: true, button_id: buttonId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ flic-webhook error:", error?.message || error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
