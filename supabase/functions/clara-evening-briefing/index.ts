// Evening Briefing — sent at 7pm CET daily via WhatsApp
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { alertLee, cetDate } from '../_shared/alertLee.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async () => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();
    const staleDate = new Date(Date.now() - 7 * 86400000).toISOString();

    const [trialsToday, newPaidToday, addonsToday, leadsToday, hotLeads, waMsgsToday, followUpsDue, staleLeads, totalPaid, activeTrials] = await Promise.all([
      supabase.from('trial_tracking').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('subscribed', true).eq('is_trialing', false).gte('updated_at', todayISO),
      supabase.from('member_addons').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('activated_at', todayISO),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('lead_score', 70).neq('status', 'converted'),
      supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('direction', 'outbound').gte('created_at', todayISO),
      supabase.from('leads').select('id', { count: 'exact', head: true }).lte('next_follow_up_at', new Date().toISOString()).not('status', 'in', '(converted,lost)'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).or(`last_contacted_at.lt.${staleDate},last_contacted_at.is.null`).not('status', 'in', '(converted,lost)'),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('subscribed', true).eq('is_trialing', false),
      supabase.from('trial_tracking').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const t = trialsToday.count || 0, p = newPaidToday.count || 0, a = addonsToday.count || 0;
    const l = leadsToday.count || 0, h = hotLeads.count || 0, w = waMsgsToday.count || 0;
    const f = followUpsDue.count || 0, s = staleLeads.count || 0;
    const tp = totalPaid.count || 0, at = activeTrials.count || 0;
    const todayRevenue = (p * 9.99) + (a * 2.99);

    const attention: string[] = [];
    if (f > 0) attention.push(`${f} follow-up${f > 1 ? 's' : ''} overdue`);
    if (h > 0) attention.push(`${h} hot lead${h > 1 ? 's' : ''} need action`);
    if (s > 3) attention.push(`${s} leads gone stale`);

    const message =
      `\u{1F306} EVENING BRIEFING\n${cetDate()}\n${'━'.repeat(22)}\n\n` +
      `\u{1F4B0} TODAY'S REVENUE\n   \u{1F193} Trials started: ${t}\n   \u{1F4B3} New paid subs: ${p}\n   \u{2795} Add-ons sold: ${a}\n   \u{1F4B5} Today's value: \u20AC${todayRevenue.toFixed(2)}\n\n` +
      `\u{1F4CA} PIPELINE\n   \u{1F464} New leads today: ${l}\n   \u{1F525} Hot leads total: ${h}\n   \u{1F3AF} Active trials: ${at}\n   \u{1F465} Total paying: ${tp}\n\n` +
      `\u{1F916} CLARA TODAY\n   \u{1F4AC} Messages sent: ${w}\n\n` +
      `\u{26A0}\u{FE0F} NEEDS ATTENTION\n${attention.length > 0 ? attention.map(n => `   \u{26A0}\u{FE0F} ${n}`).join('\n') : '   \u{2705} Nothing \u2014 great day!'}\n\n` +
      `${'━'.repeat(22)}\nMRR: \u20AC${(tp * 9.99).toFixed(2)}/month\nGood evening Lee \u{1F6E1}\u{FE0F}`;

    await alertLee(message);

    return new Response(JSON.stringify({ success: true, metrics: { t, p, a, l, h, w, tp, at } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Evening briefing:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
