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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    // Initialize Supabase client with anon key for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plans } = await req.json();
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
      throw new Error("No subscription plans provided");
    }
    logStep("Plans provided", { plans });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    // Fetch subscription plan details from Supabase
    const { data: subscriptionPlans, error: plansError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .in("id", plans)
      .eq("is_active", true);

    if (plansError) throw new Error(`Error fetching plans: ${plansError.message}`);
    if (!subscriptionPlans || subscriptionPlans.length === 0) {
      throw new Error("No valid subscription plans found");
    }
    logStep("Subscription plans fetched", { count: subscriptionPlans.length });

    // Create line items from subscription plans
    const lineItems = subscriptionPlans.map(plan => {
      if (plan.stripe_price_id) {
        // Use existing Stripe price ID
        return {
          price: plan.stripe_price_id,
          quantity: 1,
        };
      } else {
        // Create price data dynamically
        return {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: { 
              name: plan.name,
              description: plan.description 
            },
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            recurring: { interval: plan.billing_interval },
          },
          quantity: 1,
        };
      }
    });

    logStep("Line items created", { itemCount: lineItems.length });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?plan=${plans[0] || ''}`,
      metadata: {
        user_id: user.id,
        plan_ids: plans.join(","),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});