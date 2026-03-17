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
      const message = await generateOutreachMessage(lead);
      const to = lead.phone.startsWith('whatsapp:') ? lead.phone : `whatsapp:${lead.phone}`;

      // Write to Riven command queue
      await supabase.from('clara_riven_commands').insert({
        command_type: 'dm_response',
        command_data: { channel: 'whatsapp', to: lead.phone, message, lead_id: lead.id },
        priority: 3,
      });

      // Update lead
      await supabase.from('leads').update({
        updated_at: new Date().toISOString(),
        status: 're_engaging',
      }).eq('id', lead.id);

      contacted.push(lead.email || lead.phone);
    } catch { /* continue */ }
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
