import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-SETUP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting Stripe products setup");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not available");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    logStep("Initialized Stripe and Supabase clients");

    // Require authenticated admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if ((profile?.role || 'user') !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create subscription plans
    const subscriptionPlans = [
      {
        id: "72001343-1cdf-4dd8-8aa1-99bd3f80155d",
        name: "Family Connection",
        price: 1.99,
        currency: "EUR",
        interval: "month",
        description: "Comprehensive protection for families"
      },
      {
        id: "426778f2-e2dc-451d-bc72-e9aceae0dda8", 
        name: "Premium Protection",
        price: 4.99,
        currency: "EUR",
        interval: "month",
        description: "Advanced protection with AI monitoring"
      }
    ];

    // Create regional services
    const regionalServices = [
      {
        id: "a12f903f-655b-4b8a-a5bc-198109136b14",
        name: "Call Centre Spain",
        price: 24.99,
        currency: "EUR",
        interval: "month",
        description: "Specialized emergency response for Spain"
      }
    ];

    // Create one-time products
    const oneTimeProducts = [
      {
        id: "455f72dc-52db-4fcf-ad87-9365a9109736",
        name: "LifeLink Sync Bluetooth Pendant",
        price: 59.99,
        currency: "EUR",
        description: "Waterproof Bluetooth emergency pendant with one-touch SOS activation"
      }
    ];

    const results = {
      subscriptionPlans: [],
      regionalServices: [],
      products: []
    };

    // Create subscription plan products and prices
    for (const plan of subscriptionPlans) {
      logStep(`Creating subscription plan: ${plan.name}`);
      
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        type: "service",
        metadata: {
          plan_type: "subscription",
          database_id: plan.id
        }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100),
        currency: plan.currency.toLowerCase(),
        recurring: { interval: plan.interval as 'month' | 'year' },
        metadata: {
          plan_type: "subscription",
          database_id: plan.id
        }
      });

      // Update database with Stripe price ID
      await supabase
        .from('subscription_plans')
        .update({ stripe_price_id: price.id })
        .eq('id', plan.id);

      results.subscriptionPlans.push({
        plan_name: plan.name,
        product_id: product.id,
        price_id: price.id,
        database_updated: true
      });

      logStep(`Created subscription plan: ${plan.name}`, { product_id: product.id, price_id: price.id });
    }

    // Create regional service products and prices
    for (const service of regionalServices) {
      logStep(`Creating regional service: ${service.name}`);
      
      const product = await stripe.products.create({
        name: service.name,
        description: service.description,
        type: "service",
        metadata: {
          service_type: "regional",
          database_id: service.id
        }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(service.price * 100),
        currency: service.currency.toLowerCase(),
        recurring: { interval: service.interval as 'month' | 'year' },
        metadata: {
          service_type: "regional",
          database_id: service.id
        }
      });

      // Update database - regional services don't have stripe_price_id field, so we'll add metadata
      await supabase
        .from('regional_services')
        .update({ 
          description: `${service.description} (Stripe Price: ${price.id})` 
        })
        .eq('id', service.id);

      results.regionalServices.push({
        service_name: service.name,
        product_id: product.id,
        price_id: price.id,
        database_updated: true
      });

      logStep(`Created regional service: ${service.name}`, { product_id: product.id, price_id: price.id });
    }

    // Create one-time products
    for (const item of oneTimeProducts) {
      logStep(`Creating product: ${item.name}`);
      
      const product = await stripe.products.create({
        name: item.name,
        description: item.description,
        type: "good",
        metadata: {
          product_type: "physical",
          database_id: item.id
        }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(item.price * 100),
        currency: item.currency.toLowerCase(),
        metadata: {
          product_type: "physical",
          database_id: item.id
        }
      });

      // Products table doesn't have stripe_price_id field, so we'll update description with reference
      await supabase
        .from('products')
        .update({ 
          description: `${item.description} (Stripe Price: ${price.id})` 
        })
        .eq('id', item.id);

      results.products.push({
        product_name: item.name,
        product_id: product.id,
        price_id: price.id,
        database_updated: true
      });

      logStep(`Created product: ${item.name}`, { product_id: product.id, price_id: price.id });
    }

    logStep("Stripe setup completed successfully", results);

    return new Response(JSON.stringify({
      success: true,
      message: "All Stripe products and prices created successfully",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in Stripe setup", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});