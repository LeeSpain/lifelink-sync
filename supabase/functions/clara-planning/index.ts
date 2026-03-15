import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to, From: twilioFrom, Body: body
      }).toString(),
    }
  );
};

serve(async (req) => {
  try {
    const { message, from } = await req.json();

    // Save plan command
    if (message.toLowerCase().startsWith('save ')) {
      const planName = message.replace(/^save /i, '').trim();

      const { data: recentLogs } = await supabase
        .from('dev_agent_log')
        .select('command_text')
        .order('created_at', { ascending: false })
        .limit(10);

      await supabase.from('clara_planning_journal').insert({
        plan_name: planName,
        plan_content: `Plan saved from planning session.\nContext: ${recentLogs?.map((l: any) => l.command_text).join(', ') || 'No context'}`,
        status: 'saved',
      });

      await sendWhatsApp(from,
        `💾 Plan saved: "${planName}"\nSay "show my plans" to see all plans.\nSay "execute ${planName}" when ready to run it.`
      );
      return new Response('', { status: 200 });
    }

    // Show plans command
    if (message.toLowerCase().includes('show my plans') ||
        message.toLowerCase().includes('my plans')) {
      const { data: plans } = await supabase
        .from('clara_planning_journal')
        .select('plan_name, status, created_at')
        .order('created_at', { ascending: false });

      if (!plans || plans.length === 0) {
        await sendWhatsApp(from,
          '📋 No plans saved yet.\nSay "save [plan name]" to save your current plan.'
        );
      } else {
        const list = plans.map((p: any) =>
          `• ${p.plan_name} (${p.status})`
        ).join('\n');
        await sendWhatsApp(from, `📋 Your plans:\n\n${list}`);
      }
      return new Response('', { status: 200 });
    }

    // Planning conversation
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: `You are CLARA in planning mode for Lee Wakeman, owner of LifeLink Sync (emergency protection platform). You are a strategic thinking partner. NEVER take any action — only think, suggest, develop ideas. Ask good questions. Challenge assumptions. Be concise — WhatsApp format. Help Lee develop the best possible plan. Remind him to say "save [plan name]" when ready.`,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    const reply = data.content[0].text;

    await sendWhatsApp(from, reply);

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('clara-planning error:', error);
    return new Response('', { status: 200 });
  }
});
