import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('referral-convert invoked');

  try {
    const { referred_user_id, referred_email } = await req.json();

    if (!referred_user_id) {
      return new Response(
        JSON.stringify({ error: 'referred_user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this user was already converted (prevent duplicate)
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', referred_user_id)
      .maybeSingle();

    if (existingReferral) {
      console.log('Referral already exists for user:', referred_user_id);
      return new Response(
        JSON.stringify({ success: true, already_exists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find who referred this user
    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('user_id', referred_user_id)
      .maybeSingle();

    if (!profile?.referred_by) {
      console.log('No referrer found for user:', referred_user_id);
      return new Response(
        JSON.stringify({ success: true, no_referrer: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referrerId = profile.referred_by;

    // Get next available star position
    const { data: nextPos } = await supabase.rpc('get_next_star_position', {
      p_referrer_id: referrerId,
    });

    if (!nextPos) {
      console.log('All 5 star positions filled for referrer:', referrerId);
      return new Response(
        JSON.stringify({ success: true, all_stars_filled: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create referral with active status (first payment already cleared)
    const { data: referral, error: refErr } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id,
        referred_email: referred_email || null,
        star_position: nextPos,
        status: 'active',
        converted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (refErr) {
      console.error('Failed to create referral:', refErr);
      throw refErr;
    }

    console.log('Star activated:', { referrerId, position: nextPos, referredUser: referred_user_id });

    // Check if all 5 stars are now active
    const { count: activeStars } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', referrerId)
      .eq('status', 'active');

    const allFiveGold = (activeStars ?? 0) >= 5;

    if (allFiveGold) {
      console.log('ALL 5 STARS GOLD! Triggering reward for:', referrerId);
      // Call apply-referral-reward
      try {
        await supabase.functions.invoke('apply-referral-reward', {
          body: { referrer_id: referrerId },
        });
      } catch (rewardErr) {
        console.warn('Reward application failed (will retry):', rewardErr);
      }
    }

    // Notify Lee via WhatsApp
    try {
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', referrerId)
        .maybeSingle();

      await supabase.functions.invoke('clara-escalation', {
        body: {
          type: 'morning_briefing',
          custom_message: `⭐ Referral star ${nextPos}/5 activated!\n\nReferrer: ${referrerProfile?.first_name || 'Unknown'}\nNew member: ${referred_email || referred_user_id}\n${allFiveGold ? '🎉 ALL 5 STARS GOLD — FREE YEAR TRIGGERED!' : `${activeStars}/5 stars gold`}`,
        },
      });
    } catch {
      // non-fatal
    }

    return new Response(
      JSON.stringify({
        success: true,
        star_position: nextPos,
        active_stars: activeStars,
        all_five_gold: allFiveGold,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('referral-convert error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
