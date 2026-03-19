import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const CLARA_EMAIL_SYSTEM_PROMPT = `You are CLARA (Connected Lifeline And Response Assistant), the AI assistant for LifeLink Sync — a 24/7 AI-powered emergency protection platform for individuals and families in Spain, UK and Netherlands.

Your role: Write warm, personal outreach emails that feel like they come from someone who genuinely cares about the recipient's safety. You are writing ON BEHALF of LifeLink Sync — never claim to be human, but keep the tone human and empathetic.

Key product facts for emails:
- Individual Plan: €9.99/month with a FREE 7-day trial (no credit card required)
- Add-ons: Daily Wellbeing (€2.99/mo), Medication Reminder (€2.99/mo), Family Link (€2.99/mo)
- CLARA Complete: FREE when both Daily Wellbeing + Medication Reminder are active
- Features: SOS button (app, Bluetooth pendant, voice command), CLARA AI assistant, GPS tracking, Family Circle with real-time alerts, Conference Bridge for family calls during emergencies
- The Bluetooth SOS pendant requires a paired smartphone — it does not work independently
- Emergency numbers: 112 (Spain/EU), 999 (UK), 112 (Netherlands)

Brand voice:
- Warm, trustworthy, clear — never clinical, cold, or pushy
- Tagline: "Always There. Always Ready."
- Lead with empathy and the person's safety, not sales pressure
- Keep language simple and accessible — our users range from tech-savvy to elderly
- Never provide medical advice or diagnoses

Email rules:
- Subject line: compelling, under 8 words, no clickbait
- Body: 3-4 short paragraphs maximum
- CTA: single clear action (e.g. "Start your free trial", "Add an emergency contact")
- Write in the specified language (en = English, es = Spanish, nl = Dutch)
- Personalise using the member's name and who they protect
- For trial nudges: gently remind them of the value, never guilt-trip
- For hot leads: focus on peace of mind and the free trial, not hard selling
- For anniversaries: celebrate their commitment to safety, make them feel valued
- Always include the website: lifelink-sync.com
- Sign off as "CLARA & The LifeLink Sync Team"

Respond ONLY with valid JSON (no markdown, no code fences):
{"subject":"...","body_html":"...","body_text":"..."}

The body_html should use simple inline styles suitable for email clients. Use <p> tags for paragraphs. Do not include full HTML document structure — just the inner content.`;

// ─── Logging & Bounce Protection ────────────────────────────────────────────

async function logActivity(leadId: string, action: string, source: string, success: boolean, details: Record<string, unknown> = {}) {
  try {
    await supabase.from('lead_enrichment_log').insert({ lead_id: leadId, action, source, success, details });
  } catch (e) { console.error('[email-engine] logActivity error:', e); }
}

async function recordOutreachMessage(
  leadId: string | null, channel: string, recipient: string,
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
  } catch (e) { console.error('[email-engine] recordOutreachMessage error:', e); }
}

interface BounceResult { allowed: boolean; reason?: string; leadId?: string }

async function checkEmailBounceByAddress(email: string): Promise<BounceResult> {
  // Look up lead by email to get verification status
  const { data: lead } = await supabase
    .from('leads')
    .select('id, email_verification_status, contact_confidence')
    .eq('email', email)
    .maybeSingle();

  if (!lead) return { allowed: true }; // Not a lead email (e.g. trial user) — allow

  const vs = lead.email_verification_status as string | null;
  const cc = lead.contact_confidence as string | null;

  if (vs === 'invalid') {
    return { allowed: false, reason: 'Email marked as invalid — re-enrich this lead first', leadId: lead.id };
  }
  if (vs === 'risky' && cc === 'guessed') {
    return { allowed: false, reason: 'Email confidence too low — verify before sending', leadId: lead.id };
  }

  // Unverified — verify on the fly
  if (!vs) {
    try {
      const { data, error } = await supabase.functions.invoke('enrich-lead', {
        body: { action: 'verify_email', email, lead_id: lead.id },
      });
      if (!error && data?.verification) {
        const status = data.verification.status as string;
        await supabase.from('leads').update({
          email_verification_status: status,
          email_verified: status === 'valid',
          email_verified_at: new Date().toISOString(),
          contact_confidence: status === 'valid' ? 'verified' : status === 'risky' ? 'likely' : status === 'invalid' ? 'guessed' : cc,
        }).eq('id', lead.id);

        if (status === 'invalid') {
          return { allowed: false, reason: 'Email verified as invalid by Hunter — cleared from lead', leadId: lead.id };
        }
        if (status === 'risky' && cc === 'guessed') {
          return { allowed: false, reason: 'Email confidence too low after verification — verify before sending', leadId: lead.id };
        }
      }
    } catch (e) {
      console.warn('[email-engine] On-the-fly verify failed, proceeding:', e);
    }
  }

  return { allowed: true, leadId: lead.id };
}

async function sendEmail(to: string, subject: string, bodyHtml: string, bodyText: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) { console.log('[STUB] Would email', to, subject); return; }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'CLARA — LifeLink Sync <clara@lifelink-sync.com>',
      to: [to], subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#0d1b35;padding:24px;text-align:center"><h2 style="color:white;margin:0">LifeLink Sync</h2></div><div style="padding:32px;background:#f8fafc">${bodyHtml}</div></div>`,
      text: bodyText,
    }),
  });
}

async function generateEmail(sequence: string, name: string, language: string, triggerReason: string, whoFor: string): Promise<{ subject: string; body_html: string; body_text: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: CLARA_EMAIL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Write a ${sequence} email.\n\nMember name: ${name}\nWho they protect: ${whoFor}\nLanguage: ${language}\nTrigger reason: ${triggerReason}` }],
    }),
  });
  const data = await res.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());
}

async function runTriggers() {
  const results: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. Trial Day 3 nudge — trials started 3 days ago, no emergency contacts
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const { data: staleTrials } = await supabase
      .from('trial_tracking')
      .select('user_id, phone')
      .eq('status', 'active')
      .gte('created_at', threeDaysAgo + 'T00:00:00')
      .lt('created_at', threeDaysAgo + 'T23:59:59')
      .limit(20);

    for (const trial of staleTrials || []) {
      if (!trial.user_id) continue;
      const { count } = await supabase.from('emergency_contacts').select('id', { count: 'exact' }).eq('user_id', trial.user_id);
      if ((count ?? 0) === 0) {
        const { data: profile } = await supabase.from('profiles').select('full_name, email, language_preference').eq('id', trial.user_id).maybeSingle();
        if (profile?.email) {
          const lang = profile.language_preference || 'en';
          const email = await generateEmail('trial_nudge_setup', profile.full_name || 'there', lang, 'Trial day 3, no emergency contacts added', 'self');
          await sendEmail(profile.email, email.subject, email.body_html, email.body_text);
          results.push(`Trial nudge: ${profile.email}`);
        }
      }
    }
  } catch (e) { console.warn('Trial nudge failed:', e); }

  // 2. Hot leads (score 7+) get personal email
  try {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: hotLeads } = await supabase
      .from('leads')
      .select('id, email, metadata')
      .gte('interest_level', 7)
      .eq('status', 'new')
      .gte('created_at', dayAgo)
      .limit(10);

    for (const lead of hotLeads || []) {
      if (!lead.email) continue;

      // Bounce protection
      const bounce = await checkEmailBounceByAddress(lead.email);
      if (!bounce.allowed) {
        await recordOutreachMessage(bounce.leadId || lead.id, 'email', lead.email, 'blocked', 'clara-email-engine', {
          blockedReason: bounce.reason,
        });
        await logActivity(lead.id, 'outreach_blocked', 'clara-email-engine', false, {
          channel: 'email', reason: bounce.reason,
        });
        results.push(`BLOCKED: ${lead.email} — ${bounce.reason}`);
        continue;
      }

      const leadLang = (lead.metadata as Record<string, unknown>)?.language as string || 'en';
      const email = await generateEmail('hot_lead_personal_email', 'there', leadLang, 'Lead score reached 7+', 'unknown');
      await sendEmail(lead.email, email.subject, email.body_html, email.body_text);
      await recordOutreachMessage(lead.id, 'email', lead.email, 'sent', 'clara-email-engine', {
        subject: email.subject, bodyPreview: email.body_text,
      });
      await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id);
      results.push(`Hot lead email: ${lead.email}`);
    }
  } catch (e) { console.warn('Hot lead email failed:', e); }

  // 3. Subscription anniversary
  try {
    const { data: anniversaries } = await supabase
      .from('subscribers')
      .select('user_id')
      .eq('subscribed', true)
      .limit(10);
    // Check if any have been subscribed for exactly 1 year — simplified check
    for (const sub of anniversaries || []) {
      const { data: profile } = await supabase.from('profiles').select('full_name, email, created_at, language_preference').eq('id', sub.user_id).maybeSingle();
      if (profile?.created_at) {
        const created = new Date(profile.created_at);
        const now = new Date();
        if (created.getMonth() === now.getMonth() && created.getDate() === now.getDate() && now.getFullYear() - created.getFullYear() >= 1) {
          if (profile.email) {
            const email = await generateEmail('anniversary_thank_you', profile.full_name || 'there', profile.language_preference || 'en', '1 year anniversary', 'self');
            await sendEmail(profile.email, email.subject, email.body_html, email.body_text);
            results.push(`Anniversary: ${profile.email}`);
          }
        }
      }
    }
  } catch (e) { console.warn('Anniversary check failed:', e); }

  return results;
}

serve(async (req) => {
  try {
    const body = await req.json();

    if (body.action === 'run_triggers') {
      const results = await runTriggers();
      return new Response(JSON.stringify({ success: true, triggered: results.length, details: results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'send_single') {
      const { to, sequence, language, personalisation } = body;

      // Bounce protection
      const bounce = await checkEmailBounceByAddress(to);
      if (!bounce.allowed) {
        await recordOutreachMessage(bounce.leadId || null, 'email', to, 'blocked', 'clara-email-engine', {
          blockedReason: bounce.reason,
        });
        if (bounce.leadId) {
          await logActivity(bounce.leadId, 'outreach_blocked', 'clara-email-engine', false, {
            channel: 'email', reason: bounce.reason,
          });
        }
        return new Response(JSON.stringify({ success: false, blocked: true, reason: bounce.reason }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const email = await generateEmail(
        sequence || 'general',
        personalisation?.name || 'there',
        language || 'en',
        sequence || 'manual trigger',
        personalisation?.who_for || 'self'
      );
      await sendEmail(to, email.subject, email.body_html, email.body_text);
      await recordOutreachMessage(bounce.leadId || null, 'email', to, 'sent', 'clara-email-engine', {
        subject: email.subject, bodyPreview: email.body_text,
      });
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('clara-email-engine error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
