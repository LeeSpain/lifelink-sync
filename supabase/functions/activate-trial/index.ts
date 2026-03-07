import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-TRIAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user already has a trial
    const { data: existingTrial } = await supabase
      .from('trial_tracking')
      .select('id, status, trial_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingTrial) {
      logStep("User already has a trial record", { status: existingTrial.status });
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already used your free trial.',
        existing_trial: {
          status: existingTrial.status,
          trial_end: existingTrial.trial_end
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', user.id)
      .eq('subscribed', true)
      .maybeSingle();

    if (existingSub) {
      logStep("User already has an active subscription");
      return new Response(JSON.stringify({
        success: false,
        error: 'You already have an active subscription.'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create trial tracking record
    const { error: trialError } = await supabase
      .from('trial_tracking')
      .insert({
        user_id: user.id,
        trial_start: new Date().toISOString(),
        trial_end: trialEnd,
        status: 'active'
      });

    if (trialError) throw new Error(`Failed to create trial: ${trialError.message}`);
    logStep("Trial tracking record created", { trial_end: trialEnd });

    // Upsert subscriber record with trial status
    const { error: subError } = await supabase
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email,
        subscribed: true,
        is_trialing: true,
        trial_end: trialEnd,
        subscription_tier: 'Individual',
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (subError) {
      logStep("Warning: subscriber upsert error", { message: subError.message });
    }

    logStep("Trial activated successfully", { userId: user.id, trialEnd });

    // Send welcome email via Resend (optional, non-blocking)
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        const { Resend } = await import("npm:resend@2.0.0");
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'LifeLink Sync <welcome@lifelink-sync.com>',
          to: [user.email],
          subject: 'Your 7-Day Free Trial is Active!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4F46E5;">Welcome to LifeLink Sync!</h1>
              <p>Your 7-day free trial is now active. You have full access to all Individual plan features:</p>
              <ul>
                <li>SOS activation</li>
                <li>Clara AI 24/7</li>
                <li>Live location sharing</li>
                <li>1 emergency contact</li>
                <li>Incident log</li>
                <li>1 free Family Link</li>
              </ul>
              <p>Your trial ends on <strong>${new Date(trialEnd).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
              <p>No credit card required. Subscribe anytime to continue after your trial.</p>
              <p>Best regards,<br>The LifeLink Sync Team</p>
            </div>
          `
        });
        logStep("Welcome email sent");
      }
    } catch (emailError) {
      logStep("Warning: email send failed (non-critical)", { error: String(emailError) });
    }

    return new Response(JSON.stringify({
      success: true,
      trial_end: trialEnd,
      message: 'Your 7-day free trial has been activated!'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in activate-trial", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
