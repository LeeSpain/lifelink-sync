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

  console.log('apply-referral-reward invoked');

  try {
    const { referrer_id } = await req.json();
    if (!referrer_id) {
      return new Response(
        JSON.stringify({ error: 'referrer_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify all 5 stars are active
    const { count: activeStars } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', referrer_id)
      .eq('status', 'active');

    if ((activeStars ?? 0) < 5) {
      console.log('Not all 5 stars active:', activeStars);
      return new Response(
        JSON.stringify({ success: false, reason: 'Not all 5 stars active', active: activeStars }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if reward already exists
    const { data: existingReward } = await supabase
      .from('referral_rewards')
      .select('id, status')
      .eq('user_id', referrer_id)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (existingReward) {
      console.log('Reward already exists:', existingReward.id);
      return new Response(
        JSON.stringify({ success: true, already_exists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply Stripe credit if key is available
    let stripeCouponId: string | null = null;
    if (stripeKey) {
      try {
        const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

        // Create a 100% off coupon for 12 months
        const coupon = await stripe.coupons.create({
          percent_off: 100,
          duration: 'repeating',
          duration_in_months: 12,
          name: `5-Star Referral Reward - ${referrer_id.substring(0, 8)}`,
          max_redemptions: 1,
        });
        stripeCouponId = coupon.id;

        // Find the referrer's Stripe customer ID
        const { data: subscriber } = await supabase
          .from('subscribers')
          .select('stripe_customer_id')
          .eq('user_id', referrer_id)
          .maybeSingle();

        if (subscriber?.stripe_customer_id) {
          // Apply coupon to their subscription
          const subscriptions = await stripe.subscriptions.list({
            customer: subscriber.stripe_customer_id,
            status: 'active',
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            await stripe.subscriptions.update(subscriptions.data[0].id, {
              coupon: coupon.id,
            });
            console.log('Stripe coupon applied to subscription:', subscriptions.data[0].id);
          }
        }
      } catch (stripeErr) {
        console.error('Stripe coupon creation failed (will record reward without Stripe):', stripeErr);
      }
    } else {
      console.log('STRIPE_SECRET_KEY not set — recording reward without Stripe credit');
    }

    // Record the reward
    const now = new Date();
    const endsAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const { data: reward, error: rewardErr } = await supabase
      .from('referral_rewards')
      .insert({
        user_id: referrer_id,
        reward_type: '12_months_free',
        stripe_coupon_id: stripeCouponId,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (rewardErr) throw rewardErr;

    console.log('Referral reward created:', reward.id);

    // Get referrer name for notifications
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', referrer_id)
      .maybeSingle();

    const referrerName = referrerProfile?.first_name || 'A subscriber';

    // WhatsApp Lee
    try {
      await supabase.functions.invoke('clara-escalation', {
        body: {
          type: 'morning_briefing',
          custom_message: `🎉 5-STAR REFERRAL REWARD TRIGGERED!\n\n${referrerName} has earned 12 months free!\nAll 5 referral stars are gold.\nStripe coupon: ${stripeCouponId || 'manual credit needed'}\n\nThis is a huge win.`,
        },
      });
    } catch {
      // non-fatal
    }

    return new Response(
      JSON.stringify({
        success: true,
        reward_id: reward.id,
        stripe_coupon_id: stripeCouponId,
        ends_at: endsAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('apply-referral-reward error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
