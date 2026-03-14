/**
 * gift-delivery-check
 * Cron-triggered function that delivers scheduled gifts due today.
 * Runs daily at 8am UTC via pg_cron.
 * Finds gifts with status='paid' and delivery_date <= today, sends emails.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GIFT-DELIVERY-CHECK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Cron job started");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Find paid gifts with delivery_date <= today that haven't been delivered
    const { data: dueGifts, error: queryError } = await supabase
      .from("gift_subscriptions")
      .select("id, recipient_email, recipient_name, purchaser_name, gift_type, delivery_date")
      .eq("status", "paid")
      .not("delivery_date", "is", null)
      .lte("delivery_date", today);

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!dueGifts || dueGifts.length === 0) {
      logStep("No scheduled gifts due today");
      return new Response(JSON.stringify({ success: true, delivered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Found due gifts", { count: dueGifts.length });

    let delivered = 0;
    let failed = 0;

    for (const gift of dueGifts) {
      try {
        // Call gift-send-email to send the emails
        const { error: invokeError } = await supabase.functions.invoke("gift-send-email", {
          body: { gift_id: gift.id, type: "both" },
        });

        if (invokeError) {
          logStep("Failed to send gift email", { gift_id: gift.id, error: invokeError.message });
          failed++;
        } else {
          logStep("Gift delivered", { gift_id: gift.id, recipient: gift.recipient_email });
          delivered++;
        }
      } catch (err) {
        logStep("Error delivering gift", { gift_id: gift.id, error: String(err) });
        failed++;
      }
    }

    logStep("Cron job complete", { delivered, failed, total: dueGifts.length });

    return new Response(JSON.stringify({ success: true, delivered, failed, total: dueGifts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
