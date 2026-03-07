import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECONCILE-STRIPE-DATA] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ error: "No Stripe customer found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 50,
    });

    logStep("Found payment intents", { count: paymentIntents.data.length });

    let reconciledData = {
      subscriptions: [],
      orders: [],
      registrationSelections: null
    };

    // Reconcile subscriptions for this customer regardless of payment metadata
    const allSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 50,
    });

    const consideredStatuses = new Set(["active", "trialing", "past_due"]);
    const relevantSubs = allSubscriptions.data.filter(sub => consideredStatuses.has(sub.status));
    logStep("Found relevant subscriptions", { count: relevantSubs.length, statuses: Array.from(new Set(relevantSubs.map(s => s.status))) });

    if (relevantSubs.length > 0) {
      let subscriptionTiers: string[] = [];
      for (const subscription of relevantSubs) {
        reconciledData.subscriptions.push(subscription);
        for (const item of subscription.items.data) {
          try {
            const price = await stripe.prices.retrieve(item.price.id);
            const amount = price.unit_amount || 0;
            if (amount === 99) {
              subscriptionTiers.push("Family Sharing");
            } else if (amount === 199) {
              subscriptionTiers.push("Personal Account");
            } else if (amount === 499) {
              subscriptionTiers.push("Guardian Wellness");
            } else if (amount === 2499) {
              subscriptionTiers.push("Call Centre");
            } else {
              // Fallback label by amount in cents
              subscriptionTiers.push(`Plan ${amount}`);
            }
          } catch (e) {
            console.warn("Failed to retrieve price for item", item.price?.id, e);
          }
        }
      }

      const earliestEndDate = new Date(Math.min(...relevantSubs.map(sub => sub.current_period_end * 1000))).toISOString();
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: true,
        subscription_tier: Array.from(new Set(subscriptionTiers)).join(", "),
        subscription_end: earliestEndDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      logStep("Upserted subscriber from subscriptions", { tiers: subscriptionTiers });
    }
    // Process each successful payment intent
    for (const paymentIntent of paymentIntents.data) {
      if (paymentIntent.status === "succeeded" && paymentIntent.metadata) {
        logStep("Processing successful payment", { paymentIntentId: paymentIntent.id });

        const subscriptionPlans = JSON.parse(paymentIntent.metadata.subscription_plans || '[]');
        const products = JSON.parse(paymentIntent.metadata.products || '[]');
        const regionalServices = JSON.parse(paymentIntent.metadata.regional_services || '[]');

        // Check if we already have registration selections for this payment
        const { data: existingSelections } = await supabaseClient
          .from('registration_selections')
          .select('*')
          .eq('session_id', paymentIntent.id)
          .eq('user_id', user.id)
          .single();

        if (!existingSelections) {
          // Create registration selections
          const { data: newSelection, error: selectionError } = await supabaseClient
            .from('registration_selections')
            .insert({
              user_id: user.id,
              session_id: paymentIntent.id,
              subscription_plans: subscriptionPlans,
              selected_products: products,
              selected_regional_services: regionalServices,
              total_subscription_amount: parseInt(paymentIntent.metadata.subscription_amount || '0') / 100,
              total_product_amount: parseInt(paymentIntent.metadata.product_amount || '0') / 100,
              currency: 'EUR',
              registration_completed: true,
            })
            .select()
            .single();

          if (!selectionError) {
            reconciledData.registrationSelections = newSelection;
            logStep("Created registration selection", { selectionId: newSelection.id });
          }
        }

        // Process product orders
        if (products && products.length > 0) {
          const { data: dbProducts } = await supabaseClient
            .from('products')
            .select('*')
            .in('id', products);

          for (const product of dbProducts || []) {
            // Check if order already exists
            const { data: existingOrder } = await supabaseClient
              .from('orders')
              .select('*')
              .eq('user_id', user.id)
              .eq('product_id', product.id)
              .eq('stripe_payment_intent_id', paymentIntent.id)
              .single();

            if (!existingOrder) {
              const { data: newOrder, error: orderError } = await supabaseClient
                .from('orders')
                .insert({
                  user_id: user.id,
                  product_id: product.id,
                  quantity: 1,
                  unit_price: parseFloat(product.price.toString()),
                  total_price: parseFloat(product.price.toString()),
                  currency: product.currency,
                  stripe_payment_intent_id: paymentIntent.id,
                  status: 'paid',
                })
                .select()
                .single();

              if (!orderError) {
                reconciledData.orders.push(newOrder);
                logStep("Created order", { orderId: newOrder.id, productId: product.id });
              }
            }
          }
        }

        // Subscription reconciliation moved outside the payment loop

      }
    }

    logStep("Reconciliation complete", {
      subscriptionsFound: reconciledData.subscriptions.length,
      ordersCreated: reconciledData.orders.length,
      registrationSelectionsCreated: reconciledData.registrationSelections ? 1 : 0
    });

    return new Response(JSON.stringify({
      success: true,
      reconciledData: {
        subscriptions: reconciledData.subscriptions.length,
        orders: reconciledData.orders.length,
        registrationSelections: reconciledData.registrationSelections ? 1 : 0
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in reconcile-stripe-data", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});