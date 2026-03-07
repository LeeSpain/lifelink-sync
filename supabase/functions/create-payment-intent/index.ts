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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const body = await req.json();
    const { plans, email, firstName, lastName } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Valid email is required for payment processing");
    }
    if (!Array.isArray(plans) || plans.length === 0 || !plans.every((p: unknown) => typeof p === 'string')) {
      throw new Error("Plans must be a non-empty array of plan IDs");
    }
    if (firstName && typeof firstName !== 'string') throw new Error("Invalid firstName");
    if (lastName && typeof lastName !== 'string') throw new Error("Invalid lastName");
    
    logStep("Request data received", { email, firstName, lastName, plans });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create customer
      const customer = await stripe.customers.create({
        email: email,
        name: `${firstName || ''} ${lastName || ''}`.trim(),
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Fetch plans from database
    const { data: dbPlans, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('id, name, price, currency')
      .in('id', plans);

    if (planError) throw new Error(`Error fetching plans: ${planError.message}`);
    if (!dbPlans || dbPlans.length === 0) throw new Error("No valid plans found");
    
    logStep("Fetched plans from database", { dbPlans });

    // Calculate total amount
    const totalAmount = plans.reduce((total: number, planId: string) => {
      const plan = dbPlans.find(p => p.id === planId);
      return total + (plan ? Math.round(parseFloat(plan.price.toString()) * 100) : 0); // Convert to cents
    }, 0);

    // Use the currency from the first plan (assuming all plans use the same currency)
    const currency = dbPlans[0]?.currency?.toLowerCase() || 'eur';

    logStep("Calculated total", { plans, totalAmount });

    // Create payment intent for the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency,
      customer: customerId,
      metadata: {
        email: email,
        plans: plans.join(","),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id });

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      customer_id: customerId 
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-intent", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});