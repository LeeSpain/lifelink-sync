import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const leePhone = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
  });
};

async function generateReport(from: string) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const today = new Date().toISOString().split('T')[0];

  // 1. Lead metrics
  const { count: totalLeads } = await supabase.from('leads').select('id', { count: 'exact' });
  const { count: hotLeads } = await supabase.from('leads').select('id', { count: 'exact' }).gte('interest_level', 7).not('status', 'in', '("converted","lost","stale")');
  const { count: newLeadsThisWeek } = await supabase.from('leads').select('id', { count: 'exact' }).gte('created_at', weekAgo);
  const { count: newLeadsLastWeek } = await supabase.from('leads').select('id', { count: 'exact' }).gte('created_at', twoWeeksAgo).lt('created_at', weekAgo);

  // 2. Subscriber metrics
  const { count: activeSubs } = await supabase.from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);
  const { count: activeTrials } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');
  const { count: convertedThisWeek } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'converted').gte('converted_at', weekAgo);

  // 3. Revenue
  const subCount = activeSubs ?? 0;
  const mrr = (subCount * 9.99).toFixed(2);
  const arr = (subCount * 9.99 * 12).toFixed(2);
  const newMrr = ((convertedThisWeek ?? 0) * 9.99).toFixed(2);

  // 4. Campaign performance
  const { data: campaigns } = await supabase
    .from('clara_campaign_log')
    .select('campaign_name, sent, converted, status')
    .gte('created_at', weekAgo)
    .order('sent', { ascending: false })
    .limit(5);

  const campaignCount = campaigns?.length ?? 0;
  const bestCampaign = campaigns?.[0];
  const worstCampaign = campaigns?.[campaigns.length - 1];

  // 5. Content performance
  const { data: contentPerf } = await supabase
    .from('riven_performance')
    .select('content_type, engagement_rate, conversion_count')
    .gte('created_at', weekAgo)
    .order('engagement_rate', { ascending: false })
    .limit(5);

  const bestContent = contentPerf?.[0];

  // 6. Outreach
  const { count: outreachContacted } = await supabase.from('leads').select('id', { count: 'exact' }).eq('status', 're_engaging').gte('updated_at', weekAgo);

  // 7. Riven commands
  const { count: commandsProcessed } = await supabase.from('clara_riven_commands').select('id', { count: 'exact' }).eq('status', 'complete').gte('created_at', weekAgo);
  const { count: commandsFailed } = await supabase.from('clara_riven_commands').select('id', { count: 'exact' }).eq('status', 'failed').gte('created_at', weekAgo);

  // Lead change %
  const thisW = newLeadsThisWeek ?? 0;
  const lastW = newLeadsLastWeek ?? 0;
  const leadChange = lastW > 0 ? (((thisW - lastW) / lastW) * 100).toFixed(0) : 'N/A';

  // Generate CLARA's recommendation
  const recRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: `You are CLARA, CMO of LifeLink Sync. Based on this week's data:\nNew leads: ${thisW} (${leadChange}% vs last week)\nHot leads: ${hotLeads}\nActive trials: ${activeTrials}\nMRR: €${mrr}\nCampaigns: ${campaignCount}\nOutreach: ${outreachContacted} cold leads contacted\n\nGive a 2-sentence recommendation for what to focus on this week. Be specific and actionable.` }],
    }),
  });
  const recData = await recRes.json();
  const recommendation = recData.content?.[0]?.text || 'Keep pushing outreach and content.';

  const report = `📊 WEEKLY CMO REPORT — ${today}\n\n💰 REVENUE\nMRR: €${mrr}\nARR: €${arr}\nNew MRR: +€${newMrr}\n\n👥 LEADS\nNew this week: ${thisW} (${leadChange}% vs last week)\nHot leads: ${hotLeads ?? 0}\nTotal: ${totalLeads ?? 0}\n\n🔄 CONVERSIONS\nActive trials: ${activeTrials ?? 0}\nTrial → paid this week: ${convertedThisWeek ?? 0}\nPaying members: ${subCount}\n\n📣 CAMPAIGNS\n${campaignCount} campaigns this week\n${bestCampaign ? `Best: ${bestCampaign.campaign_name} — ${bestCampaign.sent} sent` : 'No campaigns'}\n\n📱 CONTENT\n${bestContent ? `Best: ${bestContent.content_type} (${bestContent.engagement_rate}% engagement)` : 'No content data yet'}\n\n🎯 OUTREACH\nCold leads contacted: ${outreachContacted ?? 0}\n\n⚙️ RIVEN\nCommands processed: ${commandsProcessed ?? 0}\nFailed: ${commandsFailed ?? 0}\n\n🔮 CLARA'S RECOMMENDATION\n${recommendation}`;

  await sendWhatsApp(from, report);
}

serve(async (req) => {
  try {
    const body = await req.json();
    const from = body.from || leePhone;

    if (body.action === 'send_report') {
      await generateReport(from);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('clara-cmo-report error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
