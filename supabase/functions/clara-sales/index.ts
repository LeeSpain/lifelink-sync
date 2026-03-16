import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom   = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
    }
  );
  if (!res.ok) console.error('Twilio send failed:', res.status, await res.text());
};

// ── Detect sales command ────────────────────────────────────
type SalesAction = 'pipeline' | 'chase' | 'demo' | 'conversion' | 'forecast' | 'unknown';

function detectSalesAction(msg: string): SalesAction {
  const m = msg.toLowerCase();
  if (/\b(pipeline|funnel|leads|hot leads|lead score|prospects)\b/.test(m)) return 'pipeline';
  if (/\b(chase|follow.?up|nudge|re.?contact|ping)\b/.test(m)) return 'chase';
  if (/\b(demo|book|schedule|call|meeting|walkthrough)\b/.test(m)) return 'demo';
  if (/\b(conversion|convert|close|won|lost|win rate)\b/.test(m)) return 'conversion';
  if (/\b(forecast|predict|project|next month|quarter|target)\b/.test(m)) return 'forecast';
  return 'unknown';
}

// ── Action handlers ─────────────────────────────────────────

async function handlePipeline(): Promise<{ proposal: string; data: unknown }> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Pipeline breakdown by status
  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, email, phone, interest_level, status, created_at, metadata')
    .gte('created_at', weekAgo)
    .order('interest_level', { ascending: false });

  if (!allLeads?.length) {
    return { proposal: '📊 Pipeline is empty this week — no new leads.', data: null };
  }

  const hot = allLeads.filter(l => l.interest_level >= 7);
  const warm = allLeads.filter(l => l.interest_level >= 4 && l.interest_level < 7);
  const cold = allLeads.filter(l => l.interest_level < 4);

  // Enrich hot leads with names
  const enrichedHot = await Promise.all(hot.slice(0, 10).map(async (lead) => {
    let name = lead.email || lead.phone || 'Unknown';
    const { data: mem } = await supabase
      .from('clara_contact_memory')
      .select('first_name')
      .or(`contact_email.eq.${lead.email},contact_phone.eq.${lead.phone}`)
      .maybeSingle();
    if (mem?.first_name) name = mem.first_name;
    return { ...lead, display_name: name };
  }));

  const hotList = enrichedHot.map((l, i) =>
    `${i + 1}. ${l.display_name} — score ${l.interest_level}/10 (${l.status})`
  ).join('\n');

  return {
    proposal: `📊 SALES PIPELINE (7 days)\n\n🔥 Hot (7+): ${hot.length}\n🟡 Warm (4-6): ${warm.length}\n🔵 Cold (<4): ${cold.length}\nTotal: ${allLeads.length}\n\nTop hot leads:\n${hotList}\n\nReply YES to chase all hot leads, or NO to skip.`,
    data: { action: 'chase_hot', leads: hot.map(l => l.id) },
  };
}

async function handleChase(): Promise<{ proposal: string; data: unknown }> {
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  const { data: staleLeads } = await supabase
    .from('leads')
    .select('id, email, phone, interest_level, updated_at, status')
    .gte('interest_level', 5)
    .lt('updated_at', twoDaysAgo)
    .not('status', 'in', '("converted","lost","stale")')
    .order('interest_level', { ascending: false })
    .limit(20);

  if (!staleLeads?.length) {
    return { proposal: '✅ All leads are fresh — nothing to chase right now.', data: null };
  }

  const enriched = await Promise.all(staleLeads.map(async (lead) => {
    let name = lead.email || lead.phone || 'Unknown';
    const { data: mem } = await supabase
      .from('clara_contact_memory')
      .select('first_name')
      .or(`contact_email.eq.${lead.email},contact_phone.eq.${lead.phone}`)
      .maybeSingle();
    if (mem?.first_name) name = mem.first_name;
    return { ...lead, display_name: name };
  }));

  const list = enriched.map((l, i) =>
    `${i + 1}. ${l.display_name} — score ${l.interest_level} (${Math.round((Date.now() - new Date(l.updated_at).getTime()) / 3600000)}h stale)`
  ).join('\n');

  return {
    proposal: `📞 ${enriched.length} leads need chasing:\n\n${list}\n\nI'll send each a personalised WhatsApp follow-up.\nReply YES to execute or NO to cancel.`,
    data: { action: 'chase_stale', leads: enriched.map(l => l.id) },
  };
}

async function handleDemo(msg: string): Promise<{ proposal: string; data: unknown }> {
  // Use Claude to extract demo booking details
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{ role: 'user', content: `Extract demo booking details from this message. Respond with JSON only:\n{"contact_name":"name","contact_phone":"phone or null","contact_email":"email or null","preferred_time":"time or null","notes":"any notes"}\n\nMessage: "${msg}"` }],
    }),
  });
  const data = await res.json();
  const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());

  return {
    proposal: `📅 I'll book a demo for ${parsed.contact_name}.\n${parsed.contact_phone ? 'Phone: ' + parsed.contact_phone : ''}${parsed.contact_email ? '\nEmail: ' + parsed.contact_email : ''}${parsed.preferred_time ? '\nTime: ' + parsed.preferred_time : ''}\n${parsed.notes ? 'Notes: ' + parsed.notes : ''}\n\nReply YES to send the invite or NO to cancel.`,
    data: { action: 'demo', demo_data: parsed },
  };
}

async function handleConversion(): Promise<{ proposal: string; data: unknown }> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { count: totalLeads } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .gte('created_at', monthStart);

  const { count: convertedLeads } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .eq('status', 'converted')
    .gte('created_at', monthStart);

  const { count: activeTrials } = await supabase
    .from('trial_tracking').select('id', { count: 'exact' })
    .eq('status', 'active');

  const { count: convertedTrials } = await supabase
    .from('trial_tracking').select('id', { count: 'exact' })
    .eq('status', 'converted')
    .gte('converted_at', monthStart);

  const { count: lostLeads } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .eq('status', 'lost')
    .gte('updated_at', monthStart);

  const total = totalLeads ?? 0;
  const converted = convertedLeads ?? 0;
  const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

  return {
    proposal: `📈 CONVERSION REPORT (this month)\n\nTotal leads: ${total}\nConverted: ${converted}\nLost: ${lostLeads ?? 0}\nConversion rate: ${rate}%\n\nActive trials: ${activeTrials ?? 0}\nTrial → paid this month: ${convertedTrials ?? 0}\n\nReply YES for detailed breakdown by source.`,
    data: { action: 'conversion_detail' },
  };
}

async function handleForecast(): Promise<{ proposal: string; data: unknown }> {
  const { count: activeSubs } = await supabase
    .from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);

  const { count: activeTrials } = await supabase
    .from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');

  const { count: hotLeads } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .gte('interest_level', 7)
    .not('status', 'in', '("converted","lost","stale")');

  const currentMRR = (activeSubs ?? 0) * 9.99;
  const estimatedTrialConversion = Math.round((activeTrials ?? 0) * 0.3); // 30% estimate
  const estimatedLeadConversion = Math.round((hotLeads ?? 0) * 0.15); // 15% of hot leads
  const projectedNewSubs = estimatedTrialConversion + estimatedLeadConversion;
  const projectedMRR = ((activeSubs ?? 0) + projectedNewSubs) * 9.99;

  return {
    proposal: `🔮 SALES FORECAST\n\nCurrent MRR: €${currentMRR.toFixed(2)}\nActive subscribers: ${activeSubs ?? 0}\n\nIn pipeline:\n• ${activeTrials ?? 0} active trials (~${estimatedTrialConversion} expected conversions)\n• ${hotLeads ?? 0} hot leads (~${estimatedLeadConversion} expected conversions)\n\nProjected MRR (30 days): €${projectedMRR.toFixed(2)}\nProjected new subscribers: ${projectedNewSubs}`,
    data: null,
  };
}

// ── Execute approved actions ────────────────────────────────

async function executeAction(actionData: Record<string, unknown>): Promise<string> {
  const action = actionData.action as string;

  if (action === 'chase_hot' || action === 'chase_stale') {
    const leadIds = (actionData.leads as string[]) || [];
    let chased = 0;

    for (const leadId of leadIds) {
      try {
        await supabase.functions.invoke('clara-escalation', {
          body: {
            type: 'hot_lead',
            lead_id: leadId,
            clara_recommendation: 'Sales mode chase — personalised follow-up',
          },
        });
        await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);
        chased++;
      } catch { /* continue */ }
    }

    await supabase.from('clara_sales_actions').insert({
      action_type: action,
      action_data: actionData,
      status: 'executed',
      result_text: `Chased ${chased} of ${leadIds.length} leads`,
      executed_at: new Date().toISOString(),
    });

    return `✅ Chased ${chased} of ${leadIds.length} leads. Each received a personalised WhatsApp.`;
  }

  if (action === 'demo') {
    const demoData = actionData.demo_data as Record<string, string>;
    // Log the demo booking
    await supabase.from('clara_sales_actions').insert({
      action_type: 'demo_booked',
      action_data: actionData,
      status: 'executed',
      result_text: `Demo booked for ${demoData.contact_name}`,
      executed_at: new Date().toISOString(),
    });

    // Send invite to contact if phone available
    if (demoData.contact_phone) {
      const phone = demoData.contact_phone.startsWith('whatsapp:')
        ? demoData.contact_phone
        : `whatsapp:${demoData.contact_phone}`;
      await sendWhatsApp(phone,
        `Hi ${demoData.contact_name}! Lee from LifeLink Sync has booked a demo for you. We'll show you how our emergency protection platform keeps your loved ones safe 24/7. Looking forward to it! — CLARA`
      );
    }

    return `✅ Demo booked for ${demoData.contact_name}. ${demoData.contact_phone ? 'Invite sent via WhatsApp.' : 'No phone — send invite manually.'}`;
  }

  if (action === 'conversion_detail') {
    // Detailed conversion breakdown
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: convertedLeads } = await supabase
      .from('leads')
      .select('email, phone, interest_level, created_at')
      .eq('status', 'converted')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!convertedLeads?.length) {
      return '📈 No conversions this month yet. Keep chasing those hot leads!';
    }

    const list = convertedLeads.map((l, i) =>
      `${i + 1}. ${l.email || l.phone || 'Unknown'} (score ${l.interest_level})`
    ).join('\n');

    return `📈 CONVERTED THIS MONTH:\n\n${list}`;
  }

  return '✅ Action completed.';
}

// ── Main handler ────────────────────────────────────────────

serve(async (req) => {
  try {
    const { from, body: msg } = await req.json();
    const lower = msg.toLowerCase().trim();

    // ── Check for YES/NO approval ────────────────────────
    if (lower === 'yes' || lower === 'y' || lower === '👍') {
      const { data: pending } = await supabase
        .from('clara_pending_actions')
        .select('*')
        .eq('owner_phone', from)
        .eq('status', 'pending')
        .in('action_type', ['pipeline', 'chase', 'demo', 'conversion'])
        .gt('expires_at', new Date().toISOString())
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pending) {
        await sendWhatsApp(from, 'No pending sales action to approve. What do you need?');
        return new Response('', { status: 200 });
      }

      await supabase.from('clara_pending_actions')
        .update({ status: 'approved', executed_at: new Date().toISOString() })
        .eq('id', pending.id);

      const result = await executeAction(pending.action_data);
      await sendWhatsApp(from, result);
      return new Response('', { status: 200 });
    }

    if (lower === 'no' || lower === 'n' || lower === '❌' || lower === 'cancel') {
      const { data: pending } = await supabase
        .from('clara_pending_actions')
        .select('id')
        .eq('owner_phone', from)
        .eq('status', 'pending')
        .in('action_type', ['pipeline', 'chase', 'demo', 'conversion'])
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        await supabase.from('clara_pending_actions')
          .update({ status: 'rejected' })
          .eq('id', pending.id);
      }

      await sendWhatsApp(from, 'Cancelled. What else in sales?');
      return new Response('', { status: 200 });
    }

    // ── Detect and handle sales command ──────────────────
    const actionType = detectSalesAction(msg);
    let result: { proposal: string; data: unknown };

    switch (actionType) {
      case 'pipeline':
        result = await handlePipeline();
        break;
      case 'chase':
        result = await handleChase();
        break;
      case 'demo':
        result = await handleDemo(msg);
        break;
      case 'conversion':
        result = await handleConversion();
        break;
      case 'forecast':
        result = await handleForecast();
        break;
      default: {
        // Unknown — use Claude to interpret
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 300,
            system: `You are CLARA in sales mode for Lee Wakeman, owner of LifeLink Sync. He's asking about sales. Respond concisely. If you can't help, suggest: pipeline, chase, demo, conversion, forecast.`,
            messages: [{ role: 'user', content: msg }],
          }),
        });
        const aiData = await aiRes.json();
        await sendWhatsApp(from, aiData.content?.[0]?.text || 'I can help with: pipeline, chase, demo, conversion, forecast. What do you need?');
        return new Response('', { status: 200 });
      }
    }

    // Send proposal
    await sendWhatsApp(from, result.proposal);

    // Store pending action (only if there's data to act on)
    if (result.data) {
      await supabase.from('clara_pending_actions').insert({
        owner_phone: from,
        action_type: actionType,
        action_data: result.data,
        proposal_text: result.proposal,
        status: 'pending',
      });
    }

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('clara-sales error:', error);
    return new Response('', { status: 200 });
  }
});
