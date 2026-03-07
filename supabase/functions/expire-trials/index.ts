import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXPIRE-TRIALS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - checking for expired trials");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find all active trials that have expired
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('trial_tracking')
      .select('id, user_id, trial_end')
      .eq('status', 'active')
      .lt('trial_end', new Date().toISOString());

    if (fetchError) throw new Error(`Failed to fetch expired trials: ${fetchError.message}`);

    if (!expiredTrials || expiredTrials.length === 0) {
      logStep("No expired trials found");
      return new Response(JSON.stringify({ success: true, expired_count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Found ${expiredTrials.length} expired trials`);

    let expiredCount = 0;
    const errors: string[] = [];

    for (const trial of expiredTrials) {
      try {
        // Update trial status
        await supabase
          .from('trial_tracking')
          .update({ status: 'expired' })
          .eq('id', trial.id);

        // Deactivate subscriber
        await supabase
          .from('subscribers')
          .update({
            subscribed: false,
            is_trialing: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', trial.user_id);

        expiredCount++;
        logStep(`Expired trial for user ${trial.user_id}`);

        // Send trial expired email (optional, non-blocking)
        try {
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            // Get user email
            const { data: subscriber } = await supabase
              .from('subscribers')
              .select('email')
              .eq('user_id', trial.user_id)
              .maybeSingle();

            if (subscriber?.email) {
              const { Resend } = await import("npm:resend@2.0.0");
              const resend = new Resend(resendApiKey);
              await resend.emails.send({
                from: 'LifeLink Sync <noreply@lifelink-sync.com>',
                to: [subscriber.email],
                subject: 'Your LifeLink Sync Trial Has Ended',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #4F46E5;">Your Trial Has Ended</h1>
                    <p>Your 7-day free trial of LifeLink Sync has expired.</p>
                    <p>To continue using all protection features, subscribe to our Individual plan for just EUR 9.99/month.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://lifelink-sync.com/pricing" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Subscribe Now
                      </a>
                    </div>
                    <p>Thank you for trying LifeLink Sync!</p>
                  </div>
                `
              });
            }
          }
        } catch (emailErr) {
          logStep("Warning: trial expiry email failed", { error: String(emailErr) });
        }

      } catch (trialErr) {
        const msg = `Failed to expire trial ${trial.id}: ${String(trialErr)}`;
        errors.push(msg);
        logStep("ERROR", { message: msg });
      }
    }

    logStep("Trial expiry run complete", { expired_count: expiredCount, errors: errors.length });

    return new Response(JSON.stringify({
      success: true,
      expired_count: expiredCount,
      total_found: expiredTrials.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in expire-trials", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
