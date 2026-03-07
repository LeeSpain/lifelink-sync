import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key to perform writes (upsert) in Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking for trial");

      // Check if user has an active trial
      const { data: trialData } = await supabaseClient
        .from('trial_tracking')
        .select('status, trial_end')
        .eq('user_id', user.id)
        .maybeSingle();

      const isTrialing = trialData?.status === 'active';
      const trialEnd = trialData?.trial_end || null;

      // Fetch active add-ons even without Stripe
      const { data: memberAddons } = await supabaseClient
        .from('member_addons')
        .select('addon_catalog(slug)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const activeAddons = (memberAddons || [])
        .map((a: any) => a.addon_catalog?.slug)
        .filter(Boolean);

      const { data: subscriberData } = await supabaseClient
        .from('subscribers')
        .select('clara_complete_unlocked')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: isTrialing,
        is_trialing: isTrialing,
        trial_end: trialEnd,
        subscription_tier: isTrialing ? 'Individual' : null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({
        subscribed: isTrialing,
        subscription_tier: isTrialing ? 'Individual' : null,
        subscription_end: null,
        is_trialing: isTrialing,
        trial_end: trialEnd,
        active_addons: activeAddons,
        clara_complete_unlocked: subscriberData?.clara_complete_unlocked || false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      if (amount <= 999) {
        subscriptionTier = "Basic";
      } else if (amount <= 1999) {
        subscriptionTier = "Premium";
      } else {
        subscriptionTier = "Enterprise";
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    // Store stripe_subscription_id if available
    const stripeSubscriptionId = hasActiveSub ? subscriptions.data[0].id : null;

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      stripe_subscription_id: stripeSubscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });

    // Fetch trial status
    const { data: trialData } = await supabaseClient
      .from('trial_tracking')
      .select('status, trial_end')
      .eq('user_id', user.id)
      .maybeSingle();

    const isTrialing = trialData?.status === 'active';
    const trialEnd = trialData?.trial_end || null;

    // If user is trialing and has no active Stripe sub, still consider them subscribed
    let effectiveSubscribed = hasActiveSub;
    if (!hasActiveSub && isTrialing) {
      effectiveSubscribed = true;
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        subscribed: true,
        is_trialing: true,
        trial_end: trialEnd,
        subscription_tier: 'Individual',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    }

    // Fetch active add-ons
    const { data: memberAddons } = await supabaseClient
      .from('member_addons')
      .select('addon_catalog(slug)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const activeAddons = (memberAddons || [])
      .map((a: any) => a.addon_catalog?.slug)
      .filter(Boolean);

    // Fetch CLARA Complete status
    const { data: subscriberData } = await supabaseClient
      .from('subscribers')
      .select('clara_complete_unlocked')
      .eq('user_id', user.id)
      .maybeSingle();

    const claraCompleteUnlocked = subscriberData?.clara_complete_unlocked || false;

    logStep("Full subscription check complete", {
      subscribed: effectiveSubscribed,
      is_trialing: isTrialing,
      active_addons: activeAddons,
      clara_complete_unlocked: claraCompleteUnlocked
    });

    return new Response(JSON.stringify({
      subscribed: effectiveSubscribed,
      subscription_tier: effectiveSubscribed ? (subscriptionTier || 'Individual') : null,
      subscription_end: subscriptionEnd,
      is_trialing: isTrialing,
      trial_end: trialEnd,
      active_addons: activeAddons,
      clara_complete_unlocked: claraCompleteUnlocked
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});