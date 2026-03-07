import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADDON-STRIPE-SETUP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting add-on Stripe products setup");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not available");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Require authenticated admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if ((profile?.role || 'user') !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep("Admin authenticated, fetching add-ons without Stripe IDs");

    // Fetch add-ons that need Stripe products created
    const { data: addons, error: addonsError } = await supabase
      .from('addon_catalog')
      .select('*')
      .is('stripe_price_id', null)
      .eq('is_active', true);

    if (addonsError) throw new Error(`Error fetching add-ons: ${addonsError.message}`);

    const results: any[] = [];

    for (const addon of (addons || [])) {
      logStep(`Creating Stripe product for add-on: ${addon.name}`);

      const product = await stripe.products.create({
        name: `LifeLink ${addon.name}`,
        description: addon.description || '',
        metadata: {
          addon_slug: addon.slug,
          addon_id: addon.id,
          type: 'addon'
        }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(addon.price * 100),
        currency: addon.currency.toLowerCase(),
        recurring: { interval: addon.interval_type as 'month' | 'year' },
        metadata: {
          addon_slug: addon.slug,
          addon_id: addon.id,
          type: 'addon'
        }
      });

      await supabase
        .from('addon_catalog')
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id
        })
        .eq('id', addon.id);

      results.push({
        addon_name: addon.name,
        addon_slug: addon.slug,
        product_id: product.id,
        price_id: price.id
      });

      logStep(`Created add-on product: ${addon.name}`, { product_id: product.id, price_id: price.id });
    }

    // Also ensure the Individual plan has a Stripe price
    const { data: individualPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', 'Individual')
      .eq('is_active', true)
      .is('stripe_price_id', null)
      .maybeSingle();

    if (individualPlan) {
      logStep("Creating Stripe product for Individual plan");

      const product = await stripe.products.create({
        name: 'LifeLink Individual',
        description: individualPlan.description || 'Essential protection for one person',
        metadata: {
          plan_id: individualPlan.id,
          type: 'base_plan'
        }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(individualPlan.price * 100),
        currency: (individualPlan.currency || 'EUR').toLowerCase(),
        recurring: { interval: 'month' },
        metadata: {
          plan_id: individualPlan.id,
          type: 'base_plan'
        }
      });

      await supabase
        .from('subscription_plans')
        .update({ stripe_price_id: price.id })
        .eq('id', individualPlan.id);

      results.push({
        plan_name: 'Individual',
        product_id: product.id,
        price_id: price.id
      });

      logStep("Created Individual plan product", { product_id: product.id, price_id: price.id });
    }

    logStep("Add-on Stripe setup completed", { total: results.length });

    return new Response(JSON.stringify({
      success: true,
      message: "Add-on Stripe products created successfully",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in add-on Stripe setup", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
