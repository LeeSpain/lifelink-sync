// Callback Status Webhook Handler
// Receives status updates from Twilio for callback calls

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const formData = await req.formData();

    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;

    console.log(`📡 Callback status webhook: ${callStatus} for call ${callSid}`);

    // Find callback request by call SID
    const { data: callbacks } = await supabase
      .from("callback_requests")
      .select("*")
      .eq("call_sid", callSid);

    if (!callbacks || callbacks.length === 0) {
      console.log("⚠️  Callback not found for call SID:", callSid);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const callback = callbacks[0];

    // Update based on status
    switch (callStatus) {
      case "ringing":
        await supabase
          .from("callback_requests")
          .update({ status: "calling" })
          .eq("id", callback.id);
        break;

      case "in-progress":
      case "answered":
        await supabase
          .from("callback_requests")
          .update({
            status: "connected",
            call_answered_at: new Date().toISOString(),
          })
          .eq("id", callback.id);
        break;

      case "completed":
        await supabase
          .from("callback_requests")
          .update({
            status: "completed",
            call_ended_at: new Date().toISOString(),
            call_duration_seconds: parseInt(callDuration) || 0,
          })
          .eq("id", callback.id);

        // Calculate daily analytics
        await supabase
          .rpc("calculate_callback_analytics", {
            p_date: new Date().toISOString().split('T')[0],
          });
        break;

      case "no-answer":
      case "busy":
        await supabase
          .from("callback_requests")
          .update({
            status: "no_answer",
            call_ended_at: new Date().toISOString(),
          })
          .eq("id", callback.id);
        break;

      case "failed":
      case "canceled":
        await supabase
          .from("callback_requests")
          .update({
            status: "failed",
            call_ended_at: new Date().toISOString(),
          })
          .eq("id", callback.id);
        break;
    }

    console.log(`✅ Callback ${callback.id} status updated to: ${callStatus}`);

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("❌ Callback status webhook error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
