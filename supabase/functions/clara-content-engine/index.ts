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

async function getPerformanceInsights(): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: recent } = await supabase
    .from('riven_performance')
    .select('content_type, engagement_rate, content_preview')
    .gte('created_at', weekAgo)
    .order('engagement_rate', { ascending: false })
    .limit(5);

  if (!recent?.length) return 'No performance data from last week.';

  const best = recent[0];
  const worst = recent[recent.length - 1];
  return `Last week top: ${best.content_type} (${best.engagement_rate}% engagement). Worst: ${worst.content_type} (${worst.engagement_rate}%). Adjust accordingly.`;
}

async function generateWeeklyContent(from: string) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() + 1); // Start from tomorrow

  const insights = await getPerformanceInsights();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `You are CLARA, LifeLink Sync's content strategist. Generate a 7-day content calendar for the week of ${weekStart.toISOString().split('T')[0]}.\n\nBrand voice: warm, trustworthy, safety-focused, human.\nMarkets: Spain (ES), UK (EN), Netherlands (NL)\nPlatforms: Instagram, Facebook, LinkedIn\n\nPerformance insights: ${insights}\n\nFor each day produce:\n{"day":1,"theme":"...","instagram":{"caption_en":"...","caption_es":"...","hashtags":["..."],"content_type":"carousel|reel|post"},"facebook":{"post_en":"...","post_es":"..."},"linkedin":{"post_en":"..."}}\n\nThemes: Family peace of mind, Independence for elderly, Lone worker safety, Customer story, Product feature, Local news hook, Trial offer\n\nRespond with JSON array of 7 days.` }],
    }),
  });

  const data = await res.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    await sendWhatsApp(from, '⚠️ Failed to generate weekly content. Try again.');
    return;
  }

  const contentPlan = JSON.parse(jsonMatch[0]);

  // Build summary for Lee
  const summary = contentPlan.map((day: { day: number; theme: string; instagram?: { content_type: string } }) =>
    `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][day.day - 1]}: ${day.theme} — ${day.instagram?.content_type || 'post'}`
  ).join('\n');

  // Store as pending action for YES/NO
  await supabase.from('clara_pending_actions').insert({
    owner_phone: from,
    action_type: 'weekly_content',
    action_data: { content_plan: contentPlan },
    proposal_text: `Weekly content plan`,
    status: 'pending',
  });

  await sendWhatsApp(from,
    `📅 WEEKLY CONTENT READY\n\nWeek of ${weekStart.toISOString().split('T')[0]}:\n${summary}\n\n7 posts across 3 platforms.\nReply YES to schedule all or NO to cancel.`
  );
}

async function scheduleContent(contentPlan: Array<Record<string, unknown>>) {
  for (const day of contentPlan) {
    const dayData = day as { day: number; theme: string; instagram?: Record<string, string>; facebook?: Record<string, string>; linkedin?: Record<string, string> };

    // Queue each platform post as a Riven command
    if (dayData.instagram) {
      await supabase.from('clara_riven_commands').insert({
        command_type: 'post_content',
        command_data: { platform: 'instagram', day: dayData.day, theme: dayData.theme, content: dayData.instagram },
        priority: 3,
      });
    }
    if (dayData.facebook) {
      await supabase.from('clara_riven_commands').insert({
        command_type: 'post_content',
        command_data: { platform: 'facebook', day: dayData.day, theme: dayData.theme, content: dayData.facebook },
        priority: 3,
      });
    }
    if (dayData.linkedin) {
      await supabase.from('clara_riven_commands').insert({
        command_type: 'post_content',
        command_data: { platform: 'linkedin', day: dayData.day, theme: dayData.theme, content: dayData.linkedin },
        priority: 4,
      });
    }
  }
}

serve(async (req) => {
  try {
    const body = await req.json();
    const from = body.from || leePhone;

    if (body.action === 'generate_weekly') {
      await generateWeeklyContent(from);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (body.action === 'schedule') {
      await scheduleContent(body.content_plan);
      return new Response(JSON.stringify({ success: true, scheduled: body.content_plan.length }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('clara-content-engine error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
