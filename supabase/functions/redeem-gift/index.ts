import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const MONTHS_BY_TYPE: Record<string, number> = {
  monthly: 1,
  annual: 12,
  bundle: 12,
  voucher: 12,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { redeem_code, gdpr_consent } = await req.json();

    if (!redeem_code) {
      return new Response(
        JSON.stringify({ error: 'redeem_code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!gdpr_consent) {
      return new Response(
        JSON.stringify({ error: 'GDPR consent is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the gift
    const { data: gift, error: giftError } = await supabase
      .from('gift_subscriptions')
      .select('*')
      .eq('redeem_code', redeem_code.toUpperCase().trim())
      .single();

    if (giftError || !gift) {
      return new Response(
        JSON.stringify({ error: 'invalid_code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check status
    if (gift.status === 'redeemed') {
      return new Response(
        JSON.stringify({ error: 'already_redeemed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (gift.status === 'expired' ||
        new Date(gift.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['paid','delivered'].includes(gift.status)) {
      return new Response(
        JSON.stringify({ error: 'not_ready' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate subscription end date
    const months = MONTHS_BY_TYPE[gift.gift_type] || 12;
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + months);

    // Create or extend subscription
    const { data: existingSub } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingSub) {
      // Extend existing subscription
      const currentEnd = existingSub.subscription_end
        ? new Date(existingSub.subscription_end)
        : new Date();
      const newEnd = currentEnd > new Date()
        ? new Date(currentEnd)
        : new Date();
      newEnd.setMonth(newEnd.getMonth() + months);

      await supabase
        .from('subscribers')
        .update({
          subscribed: true,
          subscription_end: newEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      // Create new subscription
      await supabase
        .from('subscribers')
        .insert({
          user_id: user.id,
          email: user.email,
          subscribed: true,
          subscription_end: subscriptionEnd.toISOString(),
          is_trialing: false,
        });
    }

    // Update gift record
    await supabase
      .from('gift_subscriptions')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        recipient_user_id: user.id,
        gdpr_consent_at: new Date().toISOString(),
      })
      .eq('id', gift.id);

    return new Response(
      JSON.stringify({
        success: true,
        gift_type: gift.gift_type,
        months_added: months,
        subscription_end: subscriptionEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('redeem-gift error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
