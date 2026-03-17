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

  console.log('clara-morning-briefing invoked');

  try {
    // Run health check first
    let healthOk = true;
    let healthReport = '';
    try {
      const healthResp = await fetch(
        Deno.env.get('SUPABASE_URL') + '/functions/v1/clara-health-check',
        { method: 'POST', headers: { 'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_ANON_KEY'), 'Content-Type': 'application/json' } }
      );
      if (healthResp.ok) {
        const hd = await healthResp.json();
        healthOk = hd.allOk;
        healthReport = hd.allOk ? '\u{2705} All systems operational' : hd.report;
      }
    } catch { healthReport = '\u{2753} Health check unavailable'; }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayISO = yesterday.toISOString();

    // Overnight paid subscribers (last 12h)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const { count: overnightPaid } = await supabase
      .from('subscribers').select('id', { count: 'exact', head: true })
      .eq('subscribed', true).eq('is_trialing', false).gte('updated_at', twelveHoursAgo);

    const { count: overnightTrials } = await supabase
      .from('trial_tracking').select('id', { count: 'exact', head: true })
      .gte('created_at', twelveHoursAgo);

    // ── New leads in last 24h ──────────────────────────────────
    const { data: newLeads, count: leadCount } = await supabase
      .from('leads')
      .select('id, interest_level, status', { count: 'exact' })
      .gte('created_at', yesterdayISO);

    const totalNewLeads = leadCount ?? 0;
    const hotLeads = (newLeads ?? []).filter(l => l.interest_level >= 7).length;
    const qualifiedLeads = (newLeads ?? []).filter(l => l.status === 'qualified').length;

    // ── Active trials ──────────────────────────────────────────
    const { count: activeTrials } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // ── Trials started in last 24h ─────────────────────────────
    const { count: newTrials } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .gte('created_at', yesterdayISO);

    // ── Trials expiring today ──────────────────────────────────
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { count: expiringToday } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .gte('trial_end', todayStart.toISOString())
      .lte('trial_end', todayEnd.toISOString());

    // ── Active subscribers ─────────────────────────────────────
    const { count: activeSubscribers } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact' })
      .eq('subscribed', true);

    // ── Conversations in last 24h ──────────────────────────────
    const { count: recentConversations } = await supabase
      .from('conversations')
      .select('session_id', { count: 'exact' })
      .gte('created_at', yesterdayISO)
      .eq('message_type', 'user');

    // ── WhatsApp messages in last 24h ──────────────────────────
    const { count: waMessages } = await supabase
      .from('whatsapp_messages')
      .select('id', { count: 'exact' })
      .eq('direction', 'inbound')
      .gte('created_at', yesterdayISO);

    // ── Amber escalations in last 24h ──────────────────────────
    const { count: amberCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('status', 'amber_escalation')
      .gte('updated_at', yesterdayISO);

    // ── Gift subscriptions this week ───────────────────────────
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: giftsSoldWeek } = await supabase
      .from('gift_subscriptions')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgo)
      .neq('status', 'pending_payment');

    const { count: giftsRedeemedWeek } = await supabase
      .from('gift_subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'redeemed')
      .gte('redeemed_at', weekAgo);

    const { count: giftsPending } = await supabase
      .from('gift_subscriptions')
      .select('id', { count: 'exact' })
      .in('status', ['paid', 'delivered']);

    // ── Referral stats ─────────────────────────────────────────
    const { count: referralConversions } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .gte('converted_at', yesterdayISO);

    const { count: totalActiveStars } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    const { count: activeRewards } = await supabase
      .from('referral_rewards')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // ── Build the briefing message ─────────────────────────────
    const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const message = [
      `Good morning Lee`,
      `${dayName} ${dateStr}`,
      '',
      'OVERNIGHT SUMMARY',
      '',
      `New leads: ${totalNewLeads}`,
      `Hot leads (7+): ${hotLeads}`,
      `Qualified: ${qualifiedLeads}`,
      '',
      `Trials started: ${newTrials ?? 0}`,
      `Active trials: ${activeTrials ?? 0}`,
      `Expiring today: ${expiringToday ?? 0}`,
      '',
      `Active subscribers: ${activeSubscribers ?? 0}`,
      '',
      `Referral conversions (24h): ${referralConversions ?? 0}`,
      `Total active stars: ${totalActiveStars ?? 0}`,
      `Free year rewards active: ${activeRewards ?? 0}`,
      '',
      `Gifts sold this week: ${giftsSoldWeek ?? 0}`,
      `Gifts redeemed this week: ${giftsRedeemedWeek ?? 0}`,
      `Gifts pending: ${giftsPending ?? 0}`,
      '',
      `Chat messages: ${recentConversations ?? 0}`,
      `WhatsApp messages: ${waMessages ?? 0}`,
      `Amber escalations: ${amberCount ?? 0}`,
      '',
      '',
      'OVERNIGHT REVENUE',
      `New trials: ${overnightTrials ?? 0}`,
      `New paid: ${overnightPaid ?? 0}`,
      '',
      'SYSTEM HEALTH',
      healthReport,
      '',
      'CLARA is online and handling all enquiries.',
      '',
      'Have a great day.',
    ].join('\n');

    // ── Send via clara-escalation ──────────────────────────────
    const { data: escData, error: escErr } = await supabase.functions.invoke('clara-escalation', {
      body: {
        type: 'morning_briefing',
        custom_message: message,
      },
    });

    if (escErr) {
      console.error('Escalation failed:', escErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send briefing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Morning briefing sent:', { totalNewLeads, activeTrials, activeSubscribers });

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          new_leads: totalNewLeads,
          hot_leads: hotLeads,
          new_trials: newTrials ?? 0,
          active_trials: activeTrials ?? 0,
          expiring_today: expiringToday ?? 0,
          active_subscribers: activeSubscribers ?? 0,
          chat_messages: recentConversations ?? 0,
          whatsapp_messages: waMessages ?? 0,
          amber_escalations: amberCount ?? 0,
          gifts_sold_week: giftsSoldWeek ?? 0,
          gifts_redeemed_week: giftsRedeemedWeek ?? 0,
          gifts_pending: giftsPending ?? 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('morning-briefing error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
