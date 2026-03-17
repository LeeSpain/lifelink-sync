// Revenue Data — aggregates real subscription + Stripe data for admin dashboard
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Parallel DB queries
    const [paidRes, trialRes, addonRes, churnRes, subHistory, trialTrack, convertedTrials] = await Promise.all([
      supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true).eq('is_trialing', false),
      supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('is_trialing', true),
      supabase.from('member_addons').select('addon_id, status, addon:addon_id(slug, name, price)').eq('status', 'active'),
      supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', false).gte('updated_at', thirtyDaysAgo),
      supabase.from('subscribers').select('created_at, subscribed, is_trialing').gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: true }),
      supabase.from('trial_tracking').select('*', { count: 'exact', head: true }),
      supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'converted'),
    ]);

    const paidCount = paidRes.count || 0;
    const trialCount = trialRes.count || 0;
    const addonData = addonRes.data || [];
    const addonCount = addonData.length;

    // MRR
    const baseMRR = paidCount * 9.99;
    const addonMRR = addonCount * 2.99;
    const totalMRR = baseMRR + addonMRR;

    // Monthly trend
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthMap: Record<string, { new_subs: number; new_trials: number; month: string }> = {};
    (subHistory.data || []).forEach((s: any) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { new_subs: 0, new_trials: 0, month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
      }
      if (s.is_trialing) monthMap[key].new_trials++;
      else if (s.subscribed) monthMap[key].new_subs++;
    });
    const trend = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => ({ ...val, key, mrr: val.new_subs * 9.99 }));

    // Churn
    const churnCount = churnRes.count || 0;
    const churnRate = paidCount > 0 ? Math.round((churnCount / paidCount) * 1000) / 10 : 0;

    // Addon breakdown
    const addonSummary: Record<string, { name: string; count: number; revenue: number }> = {};
    addonData.forEach((a: any) => {
      const slug = a.addon?.slug || 'unknown';
      if (!addonSummary[slug]) addonSummary[slug] = { name: a.addon?.name || slug, count: 0, revenue: 0 };
      addonSummary[slug].count++;
      addonSummary[slug].revenue += a.addon?.price || 2.99;
    });

    // Trial conversion
    const totalTrials = trialTrack.count || 0;
    const convertedCount = convertedTrials.count || 0;
    const trialConvRate = totalTrials > 0 ? Math.round((convertedCount / totalTrials) * 100) : 0;

    // Stripe data
    let stripePayments: any[] = [];
    let stripeBalance = 0;
    if (stripeKey) {
      try {
        const [chargeResp, balResp] = await Promise.all([
          fetch('https://api.stripe.com/v1/charges?limit=10&status=succeeded', {
            headers: { 'Authorization': `Bearer ${stripeKey}` },
          }),
          fetch('https://api.stripe.com/v1/balance', {
            headers: { 'Authorization': `Bearer ${stripeKey}` },
          }),
        ]);
        const chargeData = await chargeResp.json();
        stripePayments = (chargeData.data || []).map((c: any) => ({
          id: c.id,
          amount: c.amount / 100,
          currency: (c.currency || 'eur').toUpperCase(),
          customer: c.customer,
          description: c.description || 'Subscription',
          created: c.created,
          status: c.status,
        }));
        const balData = await balResp.json();
        stripeBalance = (balData.available?.[0]?.amount || 0) / 100;
      } catch (e) {
        console.error('Stripe API error:', e);
      }
    }

    return new Response(JSON.stringify({
      mrr: Math.round(totalMRR * 100) / 100,
      arr: Math.round(totalMRR * 12 * 100) / 100,
      arpu: paidCount > 0 ? Math.round((totalMRR / paidCount) * 100) / 100 : 0,
      base_mrr: Math.round(baseMRR * 100) / 100,
      addon_mrr: Math.round(addonMRR * 100) / 100,
      paid_subscribers: paidCount,
      trialing: trialCount,
      active_addons: addonCount,
      churn_rate: churnRate,
      churn_count_30d: churnCount,
      trial_conversion_rate: trialConvRate,
      total_trials: totalTrials,
      monthly_trend: trend,
      stripe_balance: stripeBalance,
      recent_payments: stripePayments,
      addon_breakdown: Object.values(addonSummary),
      generated_at: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Revenue data error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
