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
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayISO = yesterday.toISOString();

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
      `Chat messages: ${recentConversations ?? 0}`,
      `WhatsApp messages: ${waMessages ?? 0}`,
      `Amber escalations: ${amberCount ?? 0}`,
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
