import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const leePhone = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

// ─── Logging ────────────────────────────────────────────────────────────────

async function logActivity(leadId: string, action: string, source: string, success: boolean, details: Record<string, unknown> = {}) {
  try {
    await supabase.from('lead_enrichment_log').insert({ lead_id: leadId, action, source, success, details });
  } catch (e) { console.error('[outreach] logActivity error:', e); }
}

// ─── Email Bounce Guard ─────────────────────────────────────────────────────

async function checkEmailBounce(lead: Record<string, unknown>): Promise<{ allowed: boolean; reason?: string }> {
  const verificationStatus = lead.email_verification_status as string | null;
  const confidence = lead.contact_confidence as string | null;
  const email = lead.email as string | null;

  // Rule 1: Invalid emails are always blocked
  if (verificationStatus === 'invalid') {
    return { allowed: false, reason: 'Email marked as invalid — re-enrich this lead first' };
  }

  // Rule 2: Risky + guessed = too uncertain
  if (verificationStatus === 'risky' && confidence === 'guessed') {
    return { allowed: false, reason: 'Email confidence too low — verify before sending' };
  }

  // Rule 3: Unverified email — verify on the fly via Hunter
  if (!verificationStatus && email) {
    try {
      const { data, error } = await supabase.functions.invoke('enrich-lead', {
        body: { action: 'verify_email', email, lead_id: lead.id },
      });

      if (!error && data?.verification) {
        const status = data.verification.status as string;
        // Update lead with fresh verification
        await supabase.from('leads').update({
          email_verification_status: status,
          email_verified: status === 'valid',
          email_verified_at: new Date().toISOString(),
          contact_confidence: status === 'valid' ? 'verified' : status === 'risky' ? 'likely' : status === 'invalid' ? 'guessed' : lead.contact_confidence,
        }).eq('id', lead.id);

        if (status === 'invalid') {
          return { allowed: false, reason: 'Email verified as invalid by Hunter — cleared from lead' };
        }
        if (status === 'risky' && confidence === 'guessed') {
          return { allowed: false, reason: 'Email confidence too low after verification — verify before sending' };
        }
      }
    } catch (e) {
      console.warn('[outreach] On-the-fly verify failed, proceeding:', e);
    }
  }

  return { allowed: true };
}

async function recordOutreachMessage(
  leadId: string, channel: string, recipient: string,
  status: 'sent' | 'blocked', sourceFunction: string,
  opts: { subject?: string; bodyPreview?: string; blockedReason?: string } = {}
) {
  try {
    await supabase.from('outreach_messages').insert({
      lead_id: leadId,
      channel,
      recipient,
      subject: opts.subject || null,
      body_preview: opts.bodyPreview?.slice(0, 500) || null,
      status,
      blocked_reason: opts.blockedReason || null,
      source_function: sourceFunction,
    });
  } catch (e) { console.error('[outreach] recordOutreachMessage error:', e); }
}

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
  });
};

async function generateOutreachMessage(lead: Record<string, unknown>): Promise<string> {
  const daysSinceContact = lead.updated_at
    ? Math.round((Date.now() - new Date(lead.updated_at as string).getTime()) / 86400000)
    : 30;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: `Write a re-engagement WhatsApp for LifeLink Sync.\n\nLead context:\nEmail: ${lead.email || 'unknown'}\nInterest: ${lead.interest_level}/10\nDays since contact: ${daysSinceContact}\nStatus: ${lead.status}\nLanguage: ${(lead.metadata as Record<string, unknown>)?.language || 'en'}\n\nIMPORTANT: Write the message in the language specified above (en=English, es=Spanish, nl=Dutch).\n\nMake it personal, warm, like Lee himself is checking in. Not salesy. Genuinely caring. Under 80 words. End with an easy question they can reply to.\n\nRespond with message text only.` }],
    }),
  });
  const data = await res.json();
  return data.content[0].text.replace(/^["']|["']$/g, '').trim();
}

async function processColdLeads(): Promise<{ contacted: number; leads: string[] }> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: coldLeads } = await supabase
    .from('leads')
    .select('id, email, phone, interest_level, status, updated_at, metadata')
    .gte('interest_level', 4)
    .lte('interest_level', 6)
    .lt('updated_at', fourteenDaysAgo)
    .not('status', 'in', '("converted","lost","stale","cold_archived")')
    .order('interest_level', { ascending: false })
    .limit(20);

  if (!coldLeads?.length) return { contacted: 0, leads: [] };

  // Check budget
  const { data: budget } = await supabase
    .from('clara_budget')
    .select('spent_amount, limit_amount, is_locked')
    .eq('budget_type', 'monthly_outreach')
    .maybeSingle();

  if (budget?.is_locked || (budget && budget.spent_amount >= budget.limit_amount)) {
    return { contacted: 0, leads: ['Budget locked or exceeded'] };
  }

  const contacted: string[] = [];

  for (const lead of coldLeads) {
    if (!lead.phone) continue;

    try {
      // Bounce protection — check email before any outreach
      const bounceCheck = await checkEmailBounce(lead);
      if (!bounceCheck.allowed) {
        await recordOutreachMessage(lead.id, 'whatsapp', lead.phone, 'blocked', 'clara-outreach-engine', {
          bodyPreview: bounceCheck.reason,
          blockedReason: bounceCheck.reason,
        });
        await logActivity(lead.id, 'outreach_blocked', 'clara-outreach-engine', false, {
          channel: 'whatsapp',
          reason: bounceCheck.reason,
        });
        continue;
      }

      const message = await generateOutreachMessage(lead);

      // Write to Riven command queue
      await supabase.from('clara_riven_commands').insert({
        command_type: 'dm_response',
        command_data: { channel: 'whatsapp', to: lead.phone, message, lead_id: lead.id },
        priority: 3,
      });

      // Record successful outreach
      await recordOutreachMessage(lead.id, 'whatsapp', lead.phone, 'sent', 'clara-outreach-engine', {
        bodyPreview: message,
      });
      await logActivity(lead.id, 'outreach_sent', 'clara-outreach-engine', true, {
        channel: 'whatsapp',
      });

      // Update lead
      await supabase.from('leads').update({
        updated_at: new Date().toISOString(),
        status: 're_engaging',
      }).eq('id', lead.id);

      contacted.push(lead.email || lead.phone);
    } catch (err) {
      console.error(`[outreach] Failed for lead ${lead.id}:`, err);
    }
  }

  // Log performance
  await supabase.from('riven_performance').insert({
    content_type: 'outreach_whatsapp',
    content_preview: `Cold lead re-engagement batch: ${contacted.length} leads`,
    audience_segment: 'cold_leads',
    sent_count: contacted.length,
    period_start: new Date().toISOString(),
  });

  return { contacted: contacted.length, leads: contacted };
}

async function sendWeeklyReport() {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { count: contacted } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .eq('status', 're_engaging').gte('updated_at', weekAgo);

  const { count: replied } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .gte('interest_level', 7).gte('updated_at', weekAgo);

  const { count: converted } = await supabase
    .from('leads').select('id', { count: 'exact' })
    .eq('status', 'converted').gte('updated_at', weekAgo);

  const c = contacted ?? 0;
  const r = replied ?? 0;
  const rate = c > 0 ? ((r / c) * 100).toFixed(0) : '0';

  await sendWhatsApp(leePhone,
    `📊 OUTREACH REPORT\nThis week I reached out to ${c} cold leads:\n\nReplied: ${r} (${rate}%)\nConverted: ${converted ?? 0}\nNo response: ${c - r}\n\nOutreach runs every 6 hours automatically.`
  );
}

serve(async (req) => {
  try {
    const body = await req.json();

    if (body.action === 'process_cold_leads') {
      const result = await processColdLeads();
      return new Response(JSON.stringify({ success: true, ...result }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (body.action === 'weekly_report') {
      await sendWeeklyReport();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('clara-outreach-engine error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
