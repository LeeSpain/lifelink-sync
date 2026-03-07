import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADDON-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { plan_id, addon_slugs } = await req.json();
    logStep("Request", { plan_id, addon_slugs });

    // Build line items
    const lineItems: any[] = [];

    // Add base plan
    if (plan_id) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .eq('is_active', true)
        .single();

      if (!plan) throw new Error("Plan not found");

      if (plan.stripe_price_id) {
        lineItems.push({ price: plan.stripe_price_id, quantity: 1 });
      } else {
        lineItems.push({
          price_data: {
            currency: (plan.currency || 'EUR').toLowerCase(),
            product_data: { name: plan.name, description: plan.description },
            unit_amount: Math.round(plan.price * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        });
      }
    } else {
      // Default to Individual plan
      const { data: defaultPlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Individual')
        .eq('is_active', true)
        .maybeSingle();

      if (defaultPlan) {
        if (defaultPlan.stripe_price_id) {
          lineItems.push({ price: defaultPlan.stripe_price_id, quantity: 1 });
        } else {
          lineItems.push({
            price_data: {
              currency: (defaultPlan.currency || 'EUR').toLowerCase(),
              product_data: { name: defaultPlan.name, description: defaultPlan.description },
              unit_amount: Math.round(defaultPlan.price * 100),
              recurring: { interval: 'month' },
            },
            quantity: 1,
          });
        }
      }
    }

    // Add selected add-ons
    const addonSlugsArray = addon_slugs || [];
    for (const slug of addonSlugsArray) {
      const { data: addon } = await supabase
        .from('addon_catalog')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!addon) {
        logStep(`Warning: add-on '${slug}' not found, skipping`);
        continue;
      }

      // For family_link, 1st is free - only bill if quantity > 1
      if (slug === 'family_link') {
        // First link is free, don't add to checkout line items for quantity=1
        continue;
      }

      if (addon.stripe_price_id) {
        lineItems.push({ price: addon.stripe_price_id, quantity: 1 });
      } else {
        lineItems.push({
          price_data: {
            currency: addon.currency.toLowerCase(),
            product_data: { name: addon.name, description: addon.description },
            unit_amount: Math.round(addon.price * 100),
            recurring: { interval: addon.interval_type },
          },
          quantity: 1,
        });
      }
    }

    if (lineItems.length === 0) {
      throw new Error("No valid line items for checkout");
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = req.headers.get("origin") || "https://lifelink-sync.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        user_id: user.id,
        addon_slugs: addonSlugsArray.join(","),
        source: 'addon_checkout'
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in addon-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
