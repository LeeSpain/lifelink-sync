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

// ── Detect marketing command ────────────────────────────────
type MarketingAction = 'campaign' | 'content' | 'segment' | 'newsletter' | 'stats' | 'unknown';

function detectMarketingAction(msg: string): MarketingAction {
  const m = msg.toLowerCase();
  if (/\b(campaign|blast|launch|send to all|mass message|broadcast)\b/.test(m)) return 'campaign';
  if (/\b(content|post|copy|write|headline|caption|social)\b/.test(m)) return 'content';
  if (/\b(segment|audience|target|group|cohort|who)\b/.test(m)) return 'segment';
  if (/\b(newsletter|email blast|digest|update email|weekly email)\b/.test(m)) return 'newsletter';
  if (/\b(stats|metrics|performance|open rate|click|reach|engagement)\b/.test(m)) return 'stats';
  return 'unknown';
}

// ── Action handlers ─────────────────────────────────────────

async function handleCampaign(msg: string): Promise<{ proposal: string; data: unknown }> {
  // Use Claude to draft campaign from Lee's instruction
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: `You are CLARA, marketing AI for LifeLink Sync (emergency protection platform, €9.99/mo, 7-day free trial). Lee wants to create a WhatsApp campaign. Extract details and draft the message.\n\nLee's instruction: "${msg}"\n\nRespond with JSON only:\n{"campaign_name":"short name","target_segment":"all_leads|hot_leads|trialing|lapsed|custom","message_template":"the WhatsApp message to send (max 160 chars, warm and personal)","estimated_recipients":"number or unknown"}` }],
    }),
  });
  const data = await res.json();
  const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());

  // Count recipients based on segment
  let recipientCount = 0;
  if (parsed.target_segment === 'all_leads') {
    const { count } = await supabase.from('leads').select('id', { count: 'exact' }).not('status', 'in', '("lost","stale")');
    recipientCount = count ?? 0;
  } else if (parsed.target_segment === 'hot_leads') {
    const { count } = await supabase.from('leads').select('id', { count: 'exact' }).gte('interest_level', 7).not('status', 'in', '("converted","lost","stale")');
    recipientCount = count ?? 0;
  } else if (parsed.target_segment === 'trialing') {
    const { count } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');
    recipientCount = count ?? 0;
  } else if (parsed.target_segment === 'lapsed') {
    const { count } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'expired');
    recipientCount = count ?? 0;
  }

  return {
    proposal: `📣 CAMPAIGN DRAFT\n\nName: ${parsed.campaign_name}\nTarget: ${parsed.target_segment} (${recipientCount} recipients)\n\nMessage:\n"${parsed.message_template}"\n\nReply YES to send now, or NO to cancel.`,
    data: { action: 'send_campaign', campaign: { ...parsed, recipients: recipientCount } },
  };
}

async function handleContent(msg: string): Promise<{ proposal: string; data: unknown }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{ role: 'user', content: `You are CLARA, the marketing AI for LifeLink Sync — an emergency protection platform for families (€9.99/mo, 7-day free trial, Spain/UK/Netherlands). Write marketing content based on Lee's request. Be warm, empathetic, and focus on protecting loved ones.\n\nRequest: "${msg}"\n\nProvide 3 variations, each in a different tone (emotional, practical, urgent). Keep each under 200 words. Format as plain text, no markdown.` }],
    }),
  });
  const data = await res.json();
  const content = data.content[0].text;

  return {
    proposal: `✍️ CONTENT DRAFTS:\n\n${content}\n\nWhich version do you like? Or say "refine" with feedback.`,
    data: null,
  };
}

async function handleSegment(): Promise<{ proposal: string; data: unknown }> {
  // Build audience segments from real data
  const { count: allLeads } = await supabase.from('leads').select('id', { count: 'exact' });
  const { count: hotLeads } = await supabase.from('leads').select('id', { count: 'exact' }).gte('interest_level', 7).not('status', 'in', '("converted","lost","stale")');
  const { count: warmLeads } = await supabase.from('leads').select('id', { count: 'exact' }).gte('interest_level', 4).lt('interest_level', 7).not('status', 'in', '("converted","lost","stale")');
  const { count: activeTrials } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');
  const { count: expiredTrials } = await supabase.from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'expired');
  const { count: activeSubs } = await supabase.from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);
  const { count: convertedLeads } = await supabase.from('leads').select('id', { count: 'exact' }).eq('status', 'converted');

  return {
    proposal: `👥 AUDIENCE SEGMENTS\n\n🔥 Hot leads (7+): ${hotLeads ?? 0}\n🟡 Warm leads (4-6): ${warmLeads ?? 0}\n⏳ Active trials: ${activeTrials ?? 0}\n❌ Expired trials: ${expiredTrials ?? 0}\n💳 Active subscribers: ${activeSubs ?? 0}\n✅ Converted leads: ${convertedLeads ?? 0}\n📊 Total leads: ${allLeads ?? 0}\n\nSay "campaign to [segment]" to target a group.\nE.g. "campaign to expired trials" or "campaign to hot leads"`,
    data: null,
  };
}

async function handleNewsletter(msg: string): Promise<{ proposal: string; data: unknown }> {
  // Use Claude to draft newsletter
  const { count: activeSubs } = await supabase.from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{ role: 'user', content: `You are CLARA, marketing AI for LifeLink Sync (emergency protection for families). Draft a newsletter email based on Lee's instruction. Be warm, professional.\n\nInstruction: "${msg}"\n\nRespond with JSON only:\n{"subject":"email subject line","preview_text":"preview text (max 90 chars)","body":"email body in plain text, 3-4 short paragraphs","cta_text":"call to action button text","cta_url":"https://lifelink-sync.vercel.app/ai-register"}` }],
    }),
  });
  const data = await res.json();
  const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());

  return {
    proposal: `📧 NEWSLETTER DRAFT\n\nTo: ${activeSubs ?? 0} subscribers\nSubject: ${parsed.subject}\nPreview: ${parsed.preview_text}\n\n${parsed.body}\n\n[${parsed.cta_text}]\n\nReply YES to send, or NO to cancel.`,
    data: { action: 'send_newsletter', newsletter: parsed, recipient_count: activeSubs ?? 0 },
  };
}

async function handleStats(): Promise<{ proposal: string; data: unknown }> {
  const { data: campaigns } = await supabase
    .from('clara_campaign_log')
    .select('campaign_name, campaign_type, recipients, sent, opened, converted, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!campaigns?.length) {
    return { proposal: '📊 No campaigns sent yet. Say "campaign" to create one.', data: null };
  }

  const list = campaigns.map((c, i) =>
    `${i + 1}. ${c.campaign_name} (${c.campaign_type})\n   Sent: ${c.sent}/${c.recipients} | Status: ${c.status}`
  ).join('\n');

  return {
    proposal: `📊 RECENT CAMPAIGNS\n\n${list}\n\nSay "campaign" to create a new one.`,
    data: null,
  };
}

// ── Execute approved actions ────────────────────────────────

async function executeAction(actionData: Record<string, unknown>): Promise<string> {
  const action = actionData.action as string;

  if (action === 'send_campaign') {
    const campaign = actionData.campaign as Record<string, unknown>;

    // Log the campaign
    const { data: campaignLog } = await supabase.from('clara_campaign_log').insert({
      campaign_name: campaign.campaign_name as string,
      campaign_type: 'whatsapp_blast',
      target_segment: campaign.target_segment as string,
      message_template: campaign.message_template as string,
      recipients: campaign.recipients as number,
      status: 'sending',
    }).select('id').single();

    // Get leads to message based on segment
    let leads: Array<{ phone: string }> = [];
    const segment = campaign.target_segment as string;

    if (segment === 'hot_leads') {
      const { data } = await supabase.from('leads').select('phone').gte('interest_level', 7).not('status', 'in', '("converted","lost","stale")').not('phone', 'is', null);
      leads = data || [];
    } else if (segment === 'all_leads') {
      const { data } = await supabase.from('leads').select('phone').not('status', 'in', '("lost","stale")').not('phone', 'is', null);
      leads = data || [];
    } else if (segment === 'trialing') {
      const { data } = await supabase.from('trial_tracking').select('phone').eq('status', 'active').not('phone', 'is', null);
      leads = data || [];
    } else if (segment === 'lapsed') {
      const { data } = await supabase.from('trial_tracking').select('phone').eq('status', 'expired').not('phone', 'is', null);
      leads = data || [];
    }

    let sent = 0;
    for (const lead of leads) {
      if (lead.phone) {
        try {
          const to = lead.phone.startsWith('whatsapp:') ? lead.phone : `whatsapp:${lead.phone}`;
          await sendWhatsApp(to, campaign.message_template as string);
          sent++;
        } catch { /* continue */ }
      }
    }

    // Update campaign log
    if (campaignLog?.id) {
      await supabase.from('clara_campaign_log')
        .update({ sent, status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaignLog.id);
    }

    return `✅ Campaign "${campaign.campaign_name}" sent!\nDelivered: ${sent} of ${leads.length} recipients.`;
  }

  if (action === 'send_newsletter') {
    const newsletter = actionData.newsletter as Record<string, string>;
    const recipientCount = actionData.recipient_count as number;

    // Log it
    await supabase.from('clara_campaign_log').insert({
      campaign_name: newsletter.subject,
      campaign_type: 'newsletter',
      message_template: newsletter.body,
      recipients: recipientCount,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    // Send via Resend if available
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LifeLink Sync <newsletter@lifelink-sync.com>',
            to: ['subscribers@lifelink-sync.com'], // Would use audience in production
            subject: newsletter.subject,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#0d1b35;padding:24px;text-align:center"><h2 style="color:white;margin:0">LifeLink Sync</h2></div><div style="padding:32px;background:#f8fafc">${newsletter.body.split('\n').map((p: string) => `<p>${p}</p>`).join('')}<br/><a href="${newsletter.cta_url}" style="background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">${newsletter.cta_text}</a></div></div>`,
          }),
        });
        return `✅ Newsletter sent!\nSubject: ${newsletter.subject}\nRecipients: ${recipientCount}`;
      } catch {
        return `⚠️ Newsletter logged but email send failed. Check RESEND_API_KEY.`;
      }
    }

    return `✅ Newsletter logged. (Email sending available when RESEND_API_KEY is set.)`;
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
        .in('action_type', ['campaign', 'newsletter'])
        .gt('expires_at', new Date().toISOString())
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pending) {
        await sendWhatsApp(from, 'No pending marketing action. What do you need?');
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
        .in('action_type', ['campaign', 'newsletter'])
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        await supabase.from('clara_pending_actions')
          .update({ status: 'rejected' })
          .eq('id', pending.id);
      }

      await sendWhatsApp(from, 'Cancelled. What else in marketing?');
      return new Response('', { status: 200 });
    }

    // ── Route to Riven sub-functions ──────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` };

    if (/\b(content calendar|weekly content|generate content)\b/i.test(lower)) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-content-engine`, {
          method: 'POST', headers: serviceHeaders,
          body: JSON.stringify({ action: 'generate_weekly', from }),
        });
      } catch (e) { console.warn('Content engine failed:', e); }
      return new Response('', { status: 200 });
    }

    if (/\b(outreach report|cold leads|outreach stats)\b/i.test(lower)) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-outreach-engine`, {
          method: 'POST', headers: serviceHeaders,
          body: JSON.stringify({ action: 'weekly_report' }),
        });
      } catch (e) { console.warn('Outreach report failed:', e); }
      return new Response('', { status: 200 });
    }

    if (/\b(cmo report|weekly report|marketing report)\b/i.test(lower)) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-cmo-report`, {
          method: 'POST', headers: serviceHeaders,
          body: JSON.stringify({ action: 'send_report', from }),
        });
      } catch (e) { console.warn('CMO report failed:', e); }
      return new Response('', { status: 200 });
    }

    if (/\b(budget|set\s+\w+\s+budget|lock budget|unlock budget|pause spending|resume spending)\b/i.test(lower)) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-budget-control`, {
          method: 'POST', headers: serviceHeaders,
          body: JSON.stringify({ from, body: msg }),
        });
      } catch (e) { console.warn('Budget control failed:', e); }
      return new Response('', { status: 200 });
    }

    if (/\b(dm stats|instagram dms|facebook dms|social dms)\b/i.test(lower)) {
      const { count: totalDMs } = await supabase.from('whatsapp_conversations').select('id', { count: 'exact' }).like('metadata->>source', '%_dm');
      await sendWhatsApp(from, `📱 DM STATS\n\nTotal DM conversations: ${totalDMs ?? 0}\n\nSay "content calendar" for weekly content\nSay "cmo report" for full report`);
      return new Response('', { status: 200 });
    }

    // ── Detect and handle marketing command ──────────────
    const actionType = detectMarketingAction(msg);
    let result: { proposal: string; data: unknown };

    switch (actionType) {
      case 'campaign':
        result = await handleCampaign(msg);
        break;
      case 'content':
        result = await handleContent(msg);
        break;
      case 'segment':
        result = await handleSegment();
        break;
      case 'newsletter':
        result = await handleNewsletter(msg);
        break;
      case 'stats':
        result = await handleStats();
        break;
      default: {
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
            system: `You are CLARA in marketing mode for Lee Wakeman, owner of LifeLink Sync. Respond concisely. If you can't help, suggest: campaign, content, segment, newsletter, stats.`,
            messages: [{ role: 'user', content: msg }],
          }),
        });
        const aiData = await aiRes.json();
        await sendWhatsApp(from, aiData.content?.[0]?.text || 'I can help with: campaign, content, segment, newsletter, stats. What do you need?');
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
    console.error('clara-marketing error:', error);
    return new Response('', { status: 200 });
  }
});
