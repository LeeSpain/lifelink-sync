import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const generateRedeemCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const segments = [4, 4, 4];
  return 'LL-' + segments
    .map(len => Array.from(
      { length: len },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join(''))
    .join('-');
};

const GIFT_PRICES: Record<string, number> = {
  monthly: 9.99,
  annual: 99.90,
  bundle: 149.00,
  voucher: 99.90,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      gift_type, recipient_email, recipient_name,
      personal_message, delivery_date, purchaser_name,
      purchaser_email, delivery_address, selected_addons
    } = await req.json();

    if (!gift_type || !recipient_email || !purchaser_email) {
      return new Response(
        JSON.stringify({ error: 'gift_type, recipient_email and purchaser_email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['monthly','annual','bundle','voucher'].includes(gift_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid gift_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get purchaser user if logged in
    let purchaser_user_id = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) purchaser_user_id = user.id;
    }

    const amount = GIFT_PRICES[gift_type];
    const redeem_code = generateRedeemCode();
    const expires_at = new Date();
    expires_at.setFullYear(expires_at.getFullYear() + 1);

    // Create gift record
    const { data: gift, error: giftError } = await supabase
      .from('gift_subscriptions')
      .insert({
        purchaser_user_id,
        purchaser_email,
        purchaser_name,
        recipient_email,
        recipient_name,
        gift_type,
        amount_paid: amount,
        currency: 'eur',
        personal_message,
        delivery_date: delivery_date || null,
        delivery_address: delivery_address || null,
        selected_addons: selected_addons || null,
        redeem_code,
        status: 'pending_payment',
        expires_at: expires_at.toISOString(),
      })
      .select()
      .single();

    if (giftError) throw giftError;

    const origin = req.headers.get('origin') ||
      'https://lifelink-sync.com';

    // Create Stripe checkout session (one-time payment)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: purchaser_email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `LifeLink Sync Gift — ${gift_type.charAt(0).toUpperCase() + gift_type.slice(1)}`,
            description: `Gift for ${recipient_name || recipient_email}`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        gift_id: gift.id,
        redeem_code,
        gift_type,
        recipient_email,
      },
      success_url: `${origin}/gift/confirmation?id=${gift.id}`,
      cancel_url: `${origin}/gift`,
    });

    return new Response(
      JSON.stringify({ url: session.url, gift_id: gift.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('gift-checkout error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
