import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = Deno.env.get("ALLOWED_ORIGINS")?.split(",") ?? [];
  const isAllowed = allowed.length === 0 || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0] ?? "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
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

    const body = await req.json();
    const { productId, amount, currency, productName } = body;
    if (!productId || typeof productId !== 'string') {
      throw new Error("Valid productId is required");
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 99999999) {
      throw new Error("Amount must be a positive number in cents (max 999,999.99)");
    }
    if (!currency || typeof currency !== 'string' || !/^[a-zA-Z]{3}$/.test(currency)) {
      throw new Error("Valid 3-letter currency code is required");
    }
    if (!productName || typeof productName !== 'string' || productName.length > 200) {
      throw new Error("Valid productName is required (max 200 chars)");
    }
    logStep("Payment data received", { productId, amount, currency, productName });

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

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { 
              name: productName,
              description: `One-time purchase of ${productName}`
            },
            unit_amount: amount, // Amount should already be in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment, not subscription
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        product_id: productId,
        payment_type: "one_time",
      },
    });

    logStep("Payment session created", { sessionId: session.id, url: session.url });

    // Optionally store order info in Supabase (using service role for writes)
    try {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      await supabaseService.from("orders").insert({
        user_id: user.id,
        product_id: productId,
        quantity: 1,
        unit_price: amount / 100, // Convert cents to euros
        total_price: amount / 100,
        currency: currency.toLowerCase(),
        stripe_payment_intent_id: session.id,
        status: "pending"
      });
      logStep("Order recorded in database");
    } catch (dbError) {
      logStep("Failed to record order in database", { error: dbError });
      // Don't fail the payment creation if database write fails
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});