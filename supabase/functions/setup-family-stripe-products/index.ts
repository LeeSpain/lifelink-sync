import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SETUP-FAMILY-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Setting up Family Access Stripe products");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create Family Seat product
    const familySeatProduct = await stripe.products.create({
      name: "Family Access Seat",
      description: "Family Access add-on: Live SOS alerts, map, and 'Received & On It' for trusted family members. Location only during SOS. No device/battery telemetry.",
      type: "service",
      metadata: {
        type: "family_seat",
        features: "live_sos_map,alerts,acknowledgment,privacy_focused"
      }
    });

    logStep("Created Family Seat product", { productId: familySeatProduct.id });

    // Create Family Seat price (€2.99/month)
    const familySeatPrice = await stripe.prices.create({
      product: familySeatProduct.id,
      unit_amount: 299, // €2.99 in cents
      currency: "eur",
      recurring: {
        interval: "month"
      },
      metadata: {
        type: "family_seat_monthly",
        billing_model: "per_seat"
      }
    });

    logStep("Created Family Seat price", { priceId: familySeatPrice.id });

    // Update existing Member product with new description if it exists
    try {
      const existingProducts = await stripe.products.list({
        limit: 100
      });

      const memberProduct = existingProducts.data.find(p => 
        p.metadata?.type === "member_plan" || p.name.toLowerCase().includes("member")
      );

      if (memberProduct) {
        await stripe.products.update(memberProduct.id, {
          description: "Member Plan: €9.99/month. Includes up to 5 Call-only Contacts (sequential dialing during SOS). Add Family Access seats for €2.99/month per contact for live alerts and maps."
        });
        logStep("Updated existing Member product description", { productId: memberProduct.id });
      }
    } catch (error) {
      logStep("Could not update existing member product", { error: error.message });
    }

    return new Response(JSON.stringify({
      success: true,
      products: {
        family_seat: {
          product_id: familySeatProduct.id,
          price_id: familySeatPrice.id,
          amount: 299,
          currency: "eur"
        }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR setting up family products", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});