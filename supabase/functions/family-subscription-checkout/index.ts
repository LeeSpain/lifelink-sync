import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FAMILY-CHECKOUT] ${step}${detailsStr}`);
};

interface CheckoutRequest {
  email: string;
  billing_type: 'owner' | 'self';
  invite_token?: string;
  seat_quantity?: number;
  invite_data?: {
    name: string;
    email: string;
    phone: string;
    relationship: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Creating family subscription checkout");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { email, billing_type, invite_token, seat_quantity = 1, invite_data }: CheckoutRequest = await req.json();

    logStep("Processing checkout request", { email, billing_type, invite_token, seat_quantity, invite_data });

    // Validate invite token if provided
    let familyInvite = null;
    if (invite_token) {
      const { data: invite, error: inviteError } = await supabaseClient
        .from('family_invites')
        .select('*')
        .eq('invite_token', invite_token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite token');
      }
      familyInvite = invite;
      logStep("Validated family invite", { inviteId: invite.id });
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }

    logStep("Customer resolved", { customerId });

    // Get or ensure Family Seat price ID
    let familySeatPrice = null as Stripe.Price | null;

    // Try to find existing price by metadata
    const prices = await stripe.prices.list({ limit: 100, active: true });
    familySeatPrice = prices.data.find((price: any) => price.metadata?.type === "family_seat_monthly") || null;

    if (!familySeatPrice) {
      logStep("Family seat price not found - ensuring product & price exist");
      // Try to find existing product
      const products = await stripe.products.list({ limit: 100, active: true });
      let familySeatProduct = products.data.find((p: any) => p.metadata?.type === "family_seat" || p.name.toLowerCase().includes("family access seat"));

      if (!familySeatProduct) {
        familySeatProduct = await stripe.products.create({
          name: "Family Access Seat",
          description: "Family Access add-on: Live SOS alerts, map, and 'Received & On It' for trusted family members. Location only during SOS. No device/battery telemetry.",
          type: "service",
          metadata: {
            type: "family_seat",
            features: "live_sos_map,alerts,acknowledgment,privacy_focused"
          }
        });
        logStep("Created Family Seat product", { productId: familySeatProduct.id });
      } else {
        logStep("Found existing Family Seat product", { productId: familySeatProduct.id });
      }

      // Create the monthly price
      familySeatPrice = await stripe.prices.create({
        product: familySeatProduct.id,
        unit_amount: 299,
        currency: "eur",
        recurring: { interval: "month" },
        metadata: { type: "family_seat_monthly", billing_model: "per_seat" }
      });
      logStep("Created Family Seat price", { priceId: familySeatPrice.id });
    }

    logStep("Using family seat price", { priceId: familySeatPrice.id });

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: familySeatPrice.id,
          quantity: seat_quantity,
        },
      ],
      success_url: `${req.headers.get("origin")}/family-checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/family-checkout-canceled`,
      metadata: {
        billing_type,
        invite_token: invite_token || "",
        email,
        ...(invite_data && {
          invitee_name: invite_data.name,
          invitee_phone: invite_data.phone,
          invitee_relationship: invite_data.relationship
        })
      },
      subscription_data: {
        metadata: {
          billing_type,
          invite_token: invite_token || "",
          email,
          ...(invite_data && {
            invitee_name: invite_data.name,
            invitee_phone: invite_data.phone,
            invitee_relationship: invite_data.relationship
          })
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Created checkout session", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR creating family checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});