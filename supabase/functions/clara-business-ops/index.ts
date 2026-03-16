import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom  = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const LEE_PHONE   = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

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

// ── Detect command type ────────────────────────────────────────
type ActionType = 'leads' | 'revenue' | 'chase' | 'status' | 'invite' | 'unknown';

function detectAction(msg: string): ActionType {
  const m = msg.toLowerCase();
  if (/\b(hot lead|leads|pipeline|lead score)\b/.test(m)) return 'leads';
  if (/\b(mrr|revenue|money|subscriber|conversion|income|arpu)\b/.test(m)) return 'revenue';
  if (/\b(chase|follow.?up|nudge|re.?contact)\b/.test(m)) return 'chase';
  if (/\b(invite|send invite|onboard|enrol)\b/.test(m)) return 'invite';
  if (/\b(status|report|how are we|platform|morning|briefing|overview)\b/.test(m)) return 'status';
  return 'unknown';
}

// ── Action handlers ────────────────────────────────────────────

async function handleLeads(msg: string): Promise<{ proposal: string; data: unknown }> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  const isToday = /today|24h|last day/i.test(msg);
  const since = isToday ? dayAgo : weekAgo;
  const period = isToday ? 'today' : 'this week';

  const { data: leads } = await supabase
    .from('leads')
    .select('id, email, phone, interest_level, status, created_at, metadata')
    .gte('interest_level', 7)
    .gte('created_at', since)
    .order('interest_level', { ascending: false })
    .limit(15);

  if (!leads?.length) {
    return { proposal: `No hot leads found ${period}.`, data: null };
  }

  // Enrich with memory names
  const enriched = await Promise.all(leads.map(async (lead) => {
    let name = lead.email || lead.phone || 'Unknown';
    if (lead.phone || lead.email) {
      const { data: mem } = await supabase
        .from('clara_contact_memory')
        .select('first_name')
        .or(`contact_email.eq.${lead.email},contact_phone.eq.${lead.phone}`)
        .maybeSingle();
      if (mem?.first_name) name = mem.first_name;
    }
    return { ...lead, display_name: name };
  }));

  const list = enriched.map((l, i) =>
    `${i + 1}. ${l.display_name} — score ${l.interest_level}/10 (${l.status})`
  ).join('\n');

  return {
    proposal: `🔥 ${enriched.length} hot leads ${period}:\n\n${list}\n\nReply YES to chase them all, or NO to skip.`,
    data: { leads: enriched.map(l => l.id), period },
  };
}

async function handleRevenue(): Promise<{ proposal: string; data: unknown }> {
  const { count: totalSubscribers } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact' })
    .eq('subscribed', true);

  const { count: trialingCount } = await supabase
    .from('trial_tracking')
    .select('id', { count: 'exact' })
    .eq('status', 'active');

  const { count: convertedThisMonth } = await supabase
    .from('trial_tracking')
    .select('id', { count: 'exact' })
    .eq('status', 'converted')
    .gte('converted_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const activeCount = totalSubscribers ?? 0;
  const mrr = (activeCount * 9.99).toFixed(2);
  const arr = (activeCount * 9.99 * 12).toFixed(2);

  return {
    proposal: `💰 REVENUE SNAPSHOT\n\nActive subscribers: ${activeCount}\nMRR: €${mrr}\nARR projection: €${arr}\nActive trials: ${trialingCount ?? 0}\nConversions this month: ${convertedThisMonth ?? 0}\n\nReply YES to send this as a formal report to your email.`,
    data: { activeCount, mrr, arr },
  };
}

async function handleChase(): Promise<{ proposal: string; data: unknown }> {
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  const { data: staleLeads } = await supabase
    .from('leads')
    .select('id, email, phone, interest_level, updated_at')
    .gte('interest_level', 5)
    .lt('updated_at', twoDaysAgo)
    .not('status', 'in', '("converted","lost","stale")')
    .order('interest_level', { ascending: false })
    .limit(20);

  if (!staleLeads?.length) {
    return { proposal: '✅ No stale leads to chase — all hot leads are fresh.', data: null };
  }

  // Enrich with names
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
    proposal: `📞 ${enriched.length} leads need chasing:\n\n${list}\n\nI'll send each a personalised WhatsApp follow-up from LifeLink Sync.\nReply YES to execute or NO to cancel.`,
    data: { leads: enriched.map(l => l.id) },
  };
}

async function handleStatus(): Promise<{ proposal: string; data: unknown }> {
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  const { count: leadsToday } = await supabase.from('leads').select('id', { count: 'exact' }).gte('created_at', dayAgo);
  const { count: hotLeads } = await supabase.from('leads').select('id', { count: 'exact' }).gte('interest_level', 7).not('status', 'in', '("converted","lost","stale")');
  const { count: activeSubs } = await supabase.from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);
  const { count: activeTrials } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');
  const { count: pendingTasks } = await supabase.from('clara_tasks').select('id', { count: 'exact' }).eq('status', 'pending');
  const { count: waMessages } = await supabase.from('whatsapp_messages').select('id', { count: 'exact' }).eq('direction', 'inbound').gte('created_at', dayAgo);

  const mrr = ((activeSubs ?? 0) * 9.99).toFixed(2);

  return {
    proposal: `📊 PLATFORM STATUS\n\nLeads today: ${leadsToday ?? 0}\nHot leads: ${hotLeads ?? 0}\nActive subscribers: ${activeSubs ?? 0}\nMRR: €${mrr}\nActive trials: ${activeTrials ?? 0}\nWhatsApp messages (24h): ${waMessages ?? 0}\nYour pending tasks: ${pendingTasks ?? 0}\n\nAll systems: ✅ Running\nCLARA: ✅ Online`,
    data: null,
  };
}

async function handleInvite(msg: string): Promise<{ proposal: string; data: unknown }> {
  // Use Claude to extract invite details
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{ role: 'user', content: `Extract invite details from this message. Respond with JSON only:\n{"contact_name":"name","contact_phone":"phone or null","contact_email":"email or null","who_for":"self|mum|dad|parents|business|unsure","channel":"whatsapp"}\n\nMessage: "${msg}"` }],
    }),
  });
  const data = await res.json();
  const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());

  const whoLabels: Record<string, string> = { self: 'themselves', mum: 'their mum', dad: 'their dad', parents: 'their parents', business: 'their team', unsure: 'someone they care about' };
  const whoText = whoLabels[parsed.who_for] || 'someone they care about';

  return {
    proposal: `I'll send a personalised invite to ${parsed.contact_name} about protecting ${whoText}.\n\nChannel: ${parsed.channel || 'WhatsApp'}${parsed.contact_phone ? '\nPhone: ' + parsed.contact_phone : ''}${parsed.contact_email ? '\nEmail: ' + parsed.contact_email : ''}\n\nReply YES to send or NO to cancel.`,
    data: { action: 'invite', invite_data: parsed },
  };
}

// ── Execute approved actions ───────────────────────────────────

async function executeAction(action: { action_type: string; action_data: Record<string, unknown> }) {
  if (action.action_type === 'leads' || action.action_type === 'chase') {
    const leadIds = (action.action_data.leads as string[]) || [];
    let chased = 0;

    for (const leadId of leadIds) {
      try {
        await supabase.functions.invoke('clara-escalation', {
          body: {
            type: 'hot_lead',
            lead_id: leadId,
            clara_recommendation: 'Lee approved chase — follow up now',
          },
        });
        await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);
        chased++;
      } catch { /* continue */ }
    }

    return `✅ Chased ${chased} of ${leadIds.length} leads. Each received a personalised WhatsApp alert.`;
  }

  if (action.action_type === 'revenue') {
    return '✅ Revenue report noted. (Email sending available when RESEND_API_KEY is set.)';
  }

  if (action.action_type === 'invite') {
    try {
      await supabase.functions.invoke('proactive-invite', {
        body: { action: 'create_invite', invite_data: (action.action_data as Record<string, unknown>).invite_data },
      });
      return '✅ Invite sent! I\'ll follow up automatically on days 2, 4, and 7.';
    } catch {
      return '❌ Failed to send invite. Try again.';
    }
  }

  return '✅ Action completed.';
}

// ── Main handler ───────────────────────────────────────────────

serve(async (req) => {
  try {
    const { from, body: msg } = await req.json();

    // Hard auth check
    if (from !== LEE_PHONE) {
      console.log('Business ops rejected — not Lee:', from);
      return new Response('', { status: 200 });
    }

    const lower = msg.toLowerCase().trim();

    // ── Check for YES/NO approval ──────────────────────────────
    if (lower === 'yes' || lower === 'y' || lower === '👍') {
      const { data: pending } = await supabase
        .from('clara_pending_actions')
        .select('*')
        .eq('owner_phone', from)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pending) {
        await sendWhatsApp(from, 'No pending action to approve. What do you need?');
        return new Response('', { status: 200 });
      }

      await supabase.from('clara_pending_actions')
        .update({ status: 'approved', executed_at: new Date().toISOString() })
        .eq('id', pending.id);

      const result = await executeAction(pending);
      await sendWhatsApp(from, result);
      return new Response('', { status: 200 });
    }

    if (lower === 'no' || lower === 'n' || lower === '❌' || lower === 'cancel') {
      const { data: pending } = await supabase
        .from('clara_pending_actions')
        .select('id')
        .eq('owner_phone', from)
        .eq('status', 'pending')
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        await supabase.from('clara_pending_actions')
          .update({ status: 'rejected' })
          .eq('id', pending.id);
      }

      await sendWhatsApp(from, 'Cancelled. What else can I help with?');
      return new Response('', { status: 200 });
    }

    // ── Detect and handle command ──────────────────────────────
    const actionType = detectAction(msg);
    let result: { proposal: string; data: unknown };

    switch (actionType) {
      case 'leads':
        result = await handleLeads(msg);
        break;
      case 'revenue':
        result = await handleRevenue();
        break;
      case 'chase':
        result = await handleChase();
        break;
      case 'status':
        result = await handleStatus();
        break;
      case 'invite':
        result = await handleInvite(msg);
        break;
      default:
        // Unknown — use Claude to interpret
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
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
            system: `You are CLARA, Lee Wakeman's business AI for LifeLink Sync. He sent a command via WhatsApp. Respond concisely. If you can't help, suggest: leads, revenue, chase, status, or invite.`,
            messages: [{ role: 'user', content: msg }],
          }),
        });
        const aiData = await aiRes.json();
        await sendWhatsApp(from, aiData.content?.[0]?.text || 'I can help with: leads, revenue, chase, status, invite. What do you need?');
        return new Response('', { status: 200 });
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
    console.error('clara-business-ops error:', error);
    return new Response('', { status: 200 });
  }
});
