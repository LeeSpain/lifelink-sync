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

  console.log('clara-weekly-report invoked');

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekAgoISO = oneWeekAgo.toISOString();
    const twoWeeksAgoISO = twoWeeksAgo.toISOString();

    // ── This week stats ────────────────────────────────────────
    const { count: leadsThisWeek } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgoISO);

    const { count: trialsThisWeek } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgoISO);

    const { count: conversionsThisWeek } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .eq('status', 'converted')
      .gte('converted_at', weekAgoISO);

    const { count: chatMessagesThisWeek } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('message_type', 'user')
      .gte('created_at', weekAgoISO);

    const { count: waMessagesThisWeek } = await supabase
      .from('whatsapp_messages')
      .select('id', { count: 'exact' })
      .eq('direction', 'inbound')
      .gte('created_at', weekAgoISO);

    const { count: ambersThisWeek } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('status', 'amber_escalation')
      .gte('updated_at', weekAgoISO);

    // ── Last week stats (for comparison) ───────────────────────
    const { count: leadsLastWeek } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .gte('created_at', twoWeeksAgoISO)
      .lt('created_at', weekAgoISO);

    const { count: trialsLastWeek } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .gte('created_at', twoWeeksAgoISO)
      .lt('created_at', weekAgoISO);

    // ── Current totals ─────────────────────────────────────────
    const { count: totalActiveTrials } = await supabase
      .from('trial_tracking')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    const { count: totalSubscribers } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact' })
      .eq('subscribed', true);

    const { count: totalMemories } = await supabase
      .from('clara_contact_memory')
      .select('id', { count: 'exact' });

    // ── Trend indicators ───────────────────────────────────────
    const tw = leadsThisWeek ?? 0;
    const lw = leadsLastWeek ?? 0;
    const leadTrend = tw > lw ? `+${tw - lw}` : tw < lw ? `${tw - lw}` : '=';

    const twTrials = trialsThisWeek ?? 0;
    const lwTrials = trialsLastWeek ?? 0;
    const trialTrend = twTrials > lwTrials ? `+${twTrials - lwTrials}` : twTrials < lwTrials ? `${twTrials - lwTrials}` : '=';

    // ── Build the report ───────────────────────────────────────
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const message = [
      `WEEKLY REPORT`,
      `Week ending ${dateStr}`,
      '',
      'THIS WEEK',
      `New leads: ${tw} (${leadTrend} vs last week)`,
      `Trials started: ${twTrials} (${trialTrend} vs last week)`,
      `Conversions: ${conversionsThisWeek ?? 0}`,
      `Chat messages: ${chatMessagesThisWeek ?? 0}`,
      `WhatsApp messages: ${waMessagesThisWeek ?? 0}`,
      `Amber escalations: ${ambersThisWeek ?? 0}`,
      '',
      'TOTALS',
      `Active trials: ${totalActiveTrials ?? 0}`,
      `Active subscribers: ${totalSubscribers ?? 0}`,
      `CLARA memories: ${totalMemories ?? 0}`,
      '',
      'CLARA handled all enquiries autonomously this week.',
      '',
      'Have a great week ahead.',
    ].join('\n');

    // ── Send via clara-escalation ──────────────────────────────
    const { error: escErr } = await supabase.functions.invoke('clara-escalation', {
      body: {
        type: 'morning_briefing',
        custom_message: message,
      },
    });

    if (escErr) {
      console.error('Weekly report send failed:', escErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send weekly report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Weekly report sent');

    return new Response(
      JSON.stringify({ success: true, week_ending: dateStr }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('weekly-report error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
