import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { payment_intent_id, customer_id, plans } = await req.json();
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Verify payment intent is succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment not completed");
    }
    logStep("Payment verified", { paymentIntentId: payment_intent_id, status: paymentIntent.status });

    // Plan pricing mapping
    const planPricing = {
      "personal": { name: "Personal Account", amount: 199 },
      "guardian": { name: "Guardian Wellness", amount: 499 },
      "family": { name: "Family Sharing", amount: 99 },
      "callcenter": { name: "Call Centre (Spain)", amount: 2499 }
    };

    // Create individual subscriptions for each plan
    const subscriptions = [];
    for (const planId of plans) {
      const plan = planPricing[planId as keyof typeof planPricing];
      if (!plan) continue;

      // Create a price for this plan
      const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: plan.amount,
        recurring: { interval: "month" },
        product_data: { name: plan.name },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer_id,
        items: [{ price: price.id }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      subscriptions.push(subscription);
      logStep("Created subscription", { planId, subscriptionId: subscription.id });
    }

    // Update subscriber record
    const subscriptionTiers = plans.map((planId: string) => {
      const plan = planPricing[planId as keyof typeof planPricing];
      return plan?.name;
    }).filter(Boolean);

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customer_id,
      subscribed: true,
      subscription_tier: subscriptionTiers.join(", "),
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated subscriber record", { subscribed: true, tiers: subscriptionTiers });

    return new Response(JSON.stringify({ 
      success: true,
      subscriptions: subscriptions.map(sub => ({ id: sub.id, status: sub.status }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscriptions", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});