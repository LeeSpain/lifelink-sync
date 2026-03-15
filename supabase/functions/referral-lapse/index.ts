import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeKey        = Deno.env.get('STRIPE_SECRET_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('referral-lapse invoked');

  try {
    const { cancelled_user_id } = await req.json();
    if (!cancelled_user_id) {
      return new Response(
        JSON.stringify({ error: 'cancelled_user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the active referral for this cancelled user
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id, star_position')
      .eq('referred_user_id', cancelled_user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!referral) {
      console.log('No active referral found for cancelled user:', cancelled_user_id);
      return new Response(
        JSON.stringify({ success: true, no_referral: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revert star to cancelled
    await supabase
      .from('referrals')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    console.log('Star reverted:', { referrerId: referral.referrer_id, position: referral.star_position });

    // Check if referrer had an active reward — if so, pause it
    const { data: activeReward } = await supabase
      .from('referral_rewards')
      .select('id, stripe_coupon_id')
      .eq('user_id', referral.referrer_id)
      .eq('status', 'active')
      .maybeSingle();

    if (activeReward) {
      // Pause the reward
      await supabase
        .from('referral_rewards')
        .update({
          status: 'paused',
          paused_reason: `Star ${referral.star_position} lapsed — referred user cancelled`,
        })
        .eq('id', activeReward.id);

      console.log('Reward paused:', activeReward.id);

      // Remove Stripe coupon from subscription if possible
      if (stripeKey && activeReward.stripe_coupon_id) {
        try {
          const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
          const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

          const { data: subscriber } = await supabase
            .from('subscribers')
            .select('stripe_customer_id')
            .eq('user_id', referral.referrer_id)
            .maybeSingle();

          if (subscriber?.stripe_customer_id) {
            const subscriptions = await stripe.subscriptions.list({
              customer: subscriber.stripe_customer_id,
              status: 'active',
              limit: 1,
            });

            if (subscriptions.data.length > 0) {
              await stripe.subscriptions.update(subscriptions.data[0].id, {
                coupon: '', // removes the coupon
              });
              console.log('Stripe coupon removed from subscription');
            }
          }
        } catch (stripeErr) {
          console.warn('Stripe coupon removal failed (non-fatal):', stripeErr);
        }
      }
    }

    // Count remaining active stars
    const { count: remainingActive } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', referral.referrer_id)
      .eq('status', 'active');

    // Get referrer name
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', referral.referrer_id)
      .maybeSingle();

    const referrerName = referrerProfile?.first_name || 'A subscriber';
    const starsNeeded = 5 - (remainingActive ?? 0);

    // WhatsApp Lee
    try {
      await supabase.functions.invoke('clara-escalation', {
        body: {
          type: 'morning_briefing',
          custom_message: `⭐ Referral star lapsed\n\n${referrerName}'s star ${referral.star_position} reverted to silver.\nA referred member cancelled.\n${remainingActive}/5 stars remain active.\n${activeReward ? '⏸️ Free year PAUSED' : `Needs ${starsNeeded} more for free year`}`,
        },
      });
    } catch {
      // non-fatal
    }

    return new Response(
      JSON.stringify({
        success: true,
        star_position: referral.star_position,
        remaining_active: remainingActive,
        reward_paused: !!activeReward,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('referral-lapse error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
