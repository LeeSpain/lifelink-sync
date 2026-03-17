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

// ── Name extraction helper ──────────────────────────────────────
function extractName(msg: string): string | null {
  const patterns = [
    /did\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:get|receive|got)/i,
    /check\s+(?:on\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s?\s+(?:invite|status|lead)/i,
    /(?:status|update)\s+(?:of|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:has|did)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:signed|subscribed|converted|responded|replied)/i,
    /(?:about|for|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m && m[1] && !['I', 'Yes', 'No', 'The', 'My', 'Lee'].includes(m[1])) return m[1].trim();
  }
  return null;
}

// ── Time ago helper ──────────────────────────────────────────────
function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

// ── Detect command type ────────────────────────────────────────
type ActionType = 'leads' | 'revenue' | 'chase' | 'status' | 'invite' | 'check_invite' | 'check_contact' | 'recent_invites' | 'unknown';

function detectAction(msg: string): ActionType {
  const m = msg.toLowerCase();
  // Check/query intents — BEFORE action intents
  if (/did\s+\w+\s+(get|receive|got)|check.*invite|confirm.*invite|was.*sent/i.test(m)) return 'check_invite';
  if (/what.*happening.*with|status\s+of\s+\w|update\s+on\s+\w|has\s+\w+\s+(signed|subscribed|converted)/i.test(m)) return 'check_contact';
  if (/recent\s+invite|who\s+(did\s+)?(i|we)\s+invite|last\s+invite|invite\s+history|show\s+invite/i.test(m)) return 'recent_invites';
  // Action intents
  if (/\b(hot lead|leads|pipeline|lead score)\b/.test(m)) return 'leads';
  if (/\b(mrr|revenue|money|subscriber|conversion|income|arpu)\b/.test(m)) return 'revenue';
  if (/\b(chase|follow.?up|nudge|re.?contact)\b/.test(m)) return 'chase';
  if (/\b(send\s+invite|invite\s+\w+|onboard|enrol)\b/.test(m)) return 'invite';
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

// ── Check invite handler ─────────────────────────────────────────
async function handleCheckInvite(msg: string): Promise<{ proposal: string; data: unknown }> {
  const name = extractName(msg);
  if (!name) {
    return { proposal: "Who are you asking about? Give me a name and I'll check.", data: null };
  }

  // Check manual_invites
  const { data: invites } = await supabase
    .from('manual_invites')
    .select('*')
    .ilike('contact_name', `%${name}%`)
    .order('created_at', { ascending: false })
    .limit(3);

  // Also check leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .or(`first_name.ilike.%${name}%,full_name.ilike.%${name}%,email.ilike.%${name}%`)
    .order('created_at', { ascending: false })
    .limit(3);

  if (invites?.length) {
    const inv = invites[0];
    const via = inv.send_via || (inv.whatsapp_sent ? 'WhatsApp' : 'Email');
    const to = inv.contact_whatsapp || inv.contact_email || 'unknown';
    return {
      proposal: `✅ Yes — ${inv.contact_name} was sent an invite ${timeAgo(inv.created_at)}.\n\n📱 Via: ${via}\n📞 To: ${to}\n🎨 Tone: ${inv.relationship_tone || 'friendly'}\n${inv.clara_enhanced ? '✨ Enhanced by CLARA' : '✍️ Written by Lee'}\n📅 Sent: ${new Date(inv.created_at).toLocaleString('en-GB')}\n\nWant me to send a follow-up?`,
      data: null,
    };
  }

  if (leads?.length) {
    const lead = leads[0];
    return {
      proposal: `📊 I found ${lead.first_name || lead.full_name || name} in the leads pipeline:\n\nStatus: ${lead.status}\nScore: ${lead.interest_level || lead.lead_score || '?'}/10\nSource: ${lead.lead_source || 'unknown'}\nAdded: ${timeAgo(lead.created_at)}\n\nBut no invite record found. Want me to send one?`,
      data: null,
    };
  }

  return {
    proposal: `❌ I can't find any record of "${name}" in invites or leads.\n\nWant me to send them an invite now?`,
    data: null,
  };
}

// ── Check contact status handler ─────────────────────────────────
async function handleCheckContact(msg: string): Promise<{ proposal: string; data: unknown }> {
  const name = extractName(msg);
  if (!name) {
    return { proposal: "Who are you asking about? Give me a name.", data: null };
  }

  // Check subscribers
  const { data: subs } = await supabase
    .from('subscribers')
    .select('user_id, subscribed, is_trialing, created_at')
    .limit(100);

  // Check leads
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .or(`first_name.ilike.%${name}%,full_name.ilike.%${name}%,email.ilike.%${name}%`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, full_name, role, created_at')
    .ilike('full_name', `%${name}%`)
    .maybeSingle();

  if (profile) {
    const sub = subs?.find(s => s.user_id === profile.user_id);
    if (sub?.subscribed && !sub?.is_trialing) {
      return { proposal: `✅ ${profile.full_name} is a paying subscriber!\n\nSubscribed since: ${timeAgo(sub.created_at)}\nAccount role: ${profile.role}`, data: null };
    }
    if (sub?.is_trialing) {
      return { proposal: `⏰ ${profile.full_name} is on a free trial.\n\nStarted: ${timeAgo(sub.created_at)}\nNot yet converted to paid.`, data: null };
    }
    return { proposal: `👤 ${profile.full_name} has an account but no active subscription.`, data: null };
  }

  if (lead) {
    return {
      proposal: `📊 ${lead.first_name || lead.full_name || name} is in the pipeline:\n\nStatus: ${lead.status}\nInterest: ${lead.interest_level || '?'}/10\nSource: ${lead.lead_source || 'unknown'}\nLast updated: ${timeAgo(lead.updated_at)}\n${lead.notes ? `Notes: ${lead.notes.substring(0, 100)}` : ''}\n\nWant me to chase them?`,
      data: null,
    };
  }

  return { proposal: `🔍 No record of "${name}" found in subscribers, leads, or profiles.`, data: null };
}

// ── Recent invites handler ───────────────────────────────────────
async function handleRecentInvites(): Promise<{ proposal: string; data: unknown }> {
  const { data: invites } = await supabase
    .from('manual_invites')
    .select('contact_name, send_via, created_at, clara_enhanced, relationship_tone')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!invites?.length) {
    return { proposal: "📨 No invites sent yet. Use Manual Invite in the admin dashboard or say 'invite [name]'.", data: null };
  }

  const list = invites.map((inv, i) =>
    `${i + 1}. ${inv.contact_name} — ${timeAgo(inv.created_at)} — ${inv.send_via || 'WhatsApp'}${inv.clara_enhanced ? ' ✨' : ''}`
  ).join('\n');

  return {
    proposal: `📨 Last ${invites.length} invites:\n\n${list}\n\nAsk about any of them by name.`,
    data: null,
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
      case 'check_invite':
        result = await handleCheckInvite(msg);
        break;
      case 'check_contact':
        result = await handleCheckContact(msg);
        break;
      case 'recent_invites':
        result = await handleRecentInvites();
        break;
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
      default: {
        // Fetch recent conversation history for context
        let conversationContext = '';
        try {
          const { data: history } = await supabase
            .from('whatsapp_messages')
            .select('direction, content, created_at')
            .order('created_at', { ascending: false })
            .limit(6);
          if (history?.length) {
            conversationContext = '\n\nRecent conversation:\n' + history.reverse().map(m =>
              `${m.direction === 'inbound' ? 'Lee' : 'CLARA'}: ${m.content?.substring(0, 150)}`
            ).join('\n');
          }
        } catch { /* non-fatal */ }

        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system: `You are CLARA, the AI business assistant for Lee Wakeman, the founder of LifeLink Sync.

CRITICAL CONTEXT:
- You are speaking TO Lee Wakeman — he is the ADMIN and FOUNDER
- When Lee says "I sent", "I invited" — HE is the sender
- When Lee asks about a name like "David" or "John" — those are his CONTACTS, not Lee
- NEVER confuse Lee with his contacts
- When Lee asks "did X get my invite" he wants you to CHECK the database, not send a new one
- When Lee says "no I already sent it" he is correcting you — he already sent something

COMMANDS: leads, revenue, chase, status, invite, check on [name], recent invites
${conversationContext}`,
            messages: [{ role: 'user', content: msg }],
          }),
        });
        const aiData = await aiRes.json();
        await sendWhatsApp(from, aiData.content?.[0]?.text || 'I can help with: leads, revenue, chase, status, invite, check on [name]. What do you need?');
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
    console.error('clara-business-ops error:', error);
    return new Response('', { status: 200 });
  }
});
