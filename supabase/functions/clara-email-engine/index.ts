import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

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
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{ role: 'user', content: `You are CLARA writing a ${sequence} email for LifeLink Sync.\n\nMember: ${name}\nWho they protect: ${whoFor}\nLanguage: ${language}\nTrigger: ${triggerReason}\n\nWrite a warm, personal email that feels like it comes from a real person who cares about their safety.\n\nSubject line: compelling, under 8 words.\nBody: 3-4 short paragraphs max.\nCTA: single clear action.\n\nRespond JSON:\n{"subject":"...","body_html":"...","body_text":"..."}` }],
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
        const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', trial.user_id).maybeSingle();
        if (profile?.email) {
          const email = await generateEmail('trial_nudge_setup', profile.full_name || 'there', 'en', 'Trial day 3, no emergency contacts added', 'self');
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
      const email = await generateEmail('hot_lead_personal_email', 'there', 'en', 'Lead score reached 7+', 'unknown');
      await sendEmail(lead.email, email.subject, email.body_html, email.body_text);
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
      const { data: profile } = await supabase.from('profiles').select('full_name, email, created_at').eq('id', sub.user_id).maybeSingle();
      if (profile?.created_at) {
        const created = new Date(profile.created_at);
        const now = new Date();
        if (created.getMonth() === now.getMonth() && created.getDate() === now.getDate() && now.getFullYear() - created.getFullYear() >= 1) {
          if (profile.email) {
            const email = await generateEmail('anniversary_thank_you', profile.full_name || 'there', 'en', '1 year anniversary', 'self');
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
      const email = await generateEmail(
        sequence || 'general',
        personalisation?.name || 'there',
        language || 'en',
        sequence || 'manual trigger',
        personalisation?.who_for || 'self'
      );
      await sendEmail(to, email.subject, email.body_html, email.body_text);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('clara-email-engine error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
