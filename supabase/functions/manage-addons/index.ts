import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-ADDONS] ${step}${detailsStr}`);
};

async function checkClaraComplete(supabase: any, userId: string) {
  const { data: activeAddons } = await supabase
    .from('member_addons')
    .select('addon_id, addon_catalog(slug)')
    .eq('user_id', userId)
    .eq('status', 'active');

  const slugs = (activeAddons || []).map((a: any) => a.addon_catalog?.slug).filter(Boolean);
  const hasWellbeing = slugs.includes('daily_wellbeing');
  const hasMedication = slugs.includes('medication_reminder');
  const shouldUnlock = hasWellbeing && hasMedication;

  // Get current state
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('clara_complete_unlocked')
    .eq('user_id', userId)
    .maybeSingle();

  const wasUnlocked = subscriber?.clara_complete_unlocked || false;

  if (shouldUnlock !== wasUnlocked) {
    // State changed - update and log
    await supabase
      .from('subscribers')
      .update({
        clara_complete_unlocked: shouldUnlock,
        active_addons: slugs,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    await supabase
      .from('clara_unlock_log')
      .insert({
        user_id: userId,
        event_type: shouldUnlock ? 'unlocked' : 'locked',
        reason: shouldUnlock
          ? 'Both daily_wellbeing and medication_reminder active'
          : 'Missing required add-on for CLARA Complete',
        daily_wellbeing_active: hasWellbeing,
        medication_reminder_active: hasMedication
      });

    logStep(`CLARA Complete ${shouldUnlock ? 'UNLOCKED' : 'LOCKED'}`, { userId });
  } else {
    // Just update the active addons list
    await supabase
      .from('subscribers')
      .update({
        active_addons: slugs,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  return { clara_complete_unlocked: shouldUnlock, active_addons: slugs };
}

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

    const { action, addon_slug, quantity } = await req.json();
    logStep("Request", { action, addon_slug, quantity });

    // LIST action
    if (action === 'list') {
      const { data: catalog } = await supabase
        .from('addon_catalog')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      const { data: active } = await supabase
        .from('member_addons')
        .select('*, addon_catalog(slug, name, price, currency, icon, category)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('clara_complete_unlocked, active_addons')
        .eq('user_id', user.id)
        .maybeSingle();

      return new Response(JSON.stringify({
        catalog: catalog || [],
        active: active || [],
        clara_complete_unlocked: subscriber?.clara_complete_unlocked || false,
        active_addons: subscriber?.active_addons || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ADD action
    if (action === 'add') {
      if (!addon_slug) throw new Error("addon_slug is required");

      // Verify user has active subscription
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('subscribed, stripe_subscription_id, stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!subscriber?.subscribed) {
        throw new Error("You must have an active subscription to add add-ons");
      }

      // Get add-on from catalog
      const { data: addon, error: addonError } = await supabase
        .from('addon_catalog')
        .select('*')
        .eq('slug', addon_slug)
        .eq('is_active', true)
        .single();

      if (addonError || !addon) throw new Error(`Add-on '${addon_slug}' not found`);

      // Check if already active
      const { data: existing } = await supabase
        .from('member_addons')
        .select('id, status, quantity')
        .eq('user_id', user.id)
        .eq('addon_id', addon.id)
        .maybeSingle();

      if (existing?.status === 'active') {
        // For family_link, allow quantity increase
        if (addon_slug === 'family_link' && quantity && quantity > existing.quantity) {
          const newQuantity = quantity;
          const freeUnits = 1;
          const billableUnits = Math.max(0, newQuantity - freeUnits);

          // Update Stripe subscription item quantity if exists
          if (existing.quantity > 1 && subscriber.stripe_subscription_id) {
            // Find existing subscription item and update
            const { data: memberAddon } = await supabase
              .from('member_addons')
              .select('stripe_subscription_item_id')
              .eq('id', existing.id)
              .single();

            if (memberAddon?.stripe_subscription_item_id && billableUnits > 0) {
              await stripe.subscriptionItems.update(memberAddon.stripe_subscription_item_id, {
                quantity: billableUnits
              });
            }
          }

          await supabase
            .from('member_addons')
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq('id', existing.id);

          const claraState = await checkClaraComplete(supabase, user.id);
          return new Response(JSON.stringify({
            success: true,
            message: `Family Link updated to ${newQuantity} links`,
            ...claraState
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        throw new Error(`Add-on '${addon_slug}' is already active`);
      }

      // Determine billing
      let stripeSubItemId: string | null = null;
      const isFamily = addon_slug === 'family_link';
      const requestedQty = quantity || 1;
      const freeUnits = isFamily ? 1 : 0;
      const billableUnits = Math.max(0, requestedQty - freeUnits);

      // Add Stripe subscription item if there are billable units and user has a Stripe subscription
      if (billableUnits > 0 && subscriber.stripe_subscription_id && addon.stripe_price_id) {
        logStep("Adding Stripe subscription item", { billableUnits, priceId: addon.stripe_price_id });

        const subItem = await stripe.subscriptionItems.create({
          subscription: subscriber.stripe_subscription_id,
          price: addon.stripe_price_id,
          quantity: billableUnits,
          metadata: {
            user_id: user.id,
            addon_slug: addon_slug,
            addon_id: addon.id
          }
        });
        stripeSubItemId = subItem.id;
        logStep("Stripe subscription item created", { itemId: subItem.id });
      }

      // Upsert member_addons record
      if (existing) {
        // Reactivate canceled addon
        await supabase
          .from('member_addons')
          .update({
            status: 'active',
            quantity: requestedQty,
            free_units: freeUnits,
            stripe_subscription_item_id: stripeSubItemId,
            activated_at: new Date().toISOString(),
            canceled_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('member_addons')
          .insert({
            user_id: user.id,
            addon_id: addon.id,
            stripe_subscription_item_id: stripeSubItemId,
            status: 'active',
            quantity: requestedQty,
            free_units: freeUnits,
            activated_at: new Date().toISOString()
          });
      }

      const claraState = await checkClaraComplete(supabase, user.id);

      logStep("Add-on activated", { addon_slug, quantity: requestedQty, billableUnits });

      return new Response(JSON.stringify({
        success: true,
        message: `${addon.name} has been activated`,
        addon_slug,
        quantity: requestedQty,
        free_units: freeUnits,
        billable_units: billableUnits,
        ...claraState
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // REMOVE action
    if (action === 'remove') {
      if (!addon_slug) throw new Error("addon_slug is required");

      const { data: memberAddon } = await supabase
        .from('member_addons')
        .select('*, addon_catalog(name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // Find by slug through a join
      const { data: addonToRemove } = await supabase
        .from('member_addons')
        .select('id, stripe_subscription_item_id, addon_catalog!inner(slug, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('addon_catalog.slug', addon_slug)
        .maybeSingle();

      if (!addonToRemove) {
        throw new Error(`Active add-on '${addon_slug}' not found`);
      }

      // Cancel Stripe subscription item if exists
      if (addonToRemove.stripe_subscription_item_id) {
        try {
          await stripe.subscriptionItems.del(addonToRemove.stripe_subscription_item_id, {
            proration_behavior: 'create_prorations'
          });
          logStep("Stripe subscription item removed");
        } catch (stripeErr) {
          logStep("Warning: Stripe item removal failed", { error: String(stripeErr) });
        }
      }

      await supabase
        .from('member_addons')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', addonToRemove.id);

      const claraState = await checkClaraComplete(supabase, user.id);

      logStep("Add-on removed", { addon_slug });

      return new Response(JSON.stringify({
        success: true,
        message: `${(addonToRemove as any).addon_catalog?.name || addon_slug} has been removed`,
        addon_slug,
        ...claraState
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Invalid action: ${action}. Use 'add', 'remove', or 'list'`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manage-addons", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
