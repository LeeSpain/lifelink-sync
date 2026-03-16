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

const invokeFunction = async (fnName: string, body: Record<string, unknown>) => {
  await fetch(Deno.env.get('SUPABASE_URL') + `/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify(body),
  });
};

serve(async (req) => {
  try {
    const { message, from } = await req.json();
    const lower = message.toLowerCase().trim();

    // ── Execute plan command ────────────────────────────────
    if (lower.startsWith('execute ') || lower.startsWith('run ')) {
      const planName = message.replace(/^(execute|run)\s+/i, '').trim();
      await invokeFunction('execute-plan', { action: 'start', from, plan_name: planName });
      return new Response('', { status: 200 });
    }

    // ── Resume plan command ─────────────────────────────────
    if (lower.startsWith('resume ')) {
      await invokeFunction('execute-plan', { action: 'resume', from });
      return new Response('', { status: 200 });
    }

    // ── Pause plan command ──────────────────────────────────
    if (lower === 'pause plan' || lower === 'stop execution' || lower === 'pause') {
      await invokeFunction('execute-plan', { action: 'pause', from });
      return new Response('', { status: 200 });
    }

    // ── Cancel plan command ─────────────────────────────────
    if (lower === 'cancel plan' || lower.startsWith('cancel ') || lower.startsWith('stop ')) {
      await invokeFunction('execute-plan', { action: 'cancel', from });
      return new Response('', { status: 200 });
    }

    // ── Plan status command ─────────────────────────────────
    if (lower === 'plan status' || lower.includes('how is') || lower === 'progress') {
      await invokeFunction('execute-plan', { action: 'status', from });
      return new Response('', { status: 200 });
    }

    // ── List plans command ──────────────────────────────────
    if (lower === 'list plans' || lower === 'my plans' ||
        lower.includes('show my plans') || lower.includes('show plans')) {
      await invokeFunction('execute-plan', { action: 'list', from });
      return new Response('', { status: 200 });
    }

    // ── Save plan command ───────────────────────────────────
    if (lower.startsWith('save ')) {
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
        `💾 Plan saved: "${planName}"\nSay "list plans" to see all plans.\nSay "execute ${planName}" to run it now.`
      );
      return new Response('', { status: 200 });
    }

    // ── DONE/SKIP for manual plan steps ─────────────────────
    if (lower === 'done' || lower === 'skip') {
      // Check if there's a running plan with a pending manual step
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .select('id')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (execution) {
        const { data: pendingApproval } = await supabase
          .from('clara_plan_approvals')
          .select('id')
          .eq('execution_id', execution.id)
          .eq('approval_status', 'pending')
          .maybeSingle();

        if (pendingApproval) {
          await invokeFunction('execute-plan', {
            action: 'step_response',
            from,
            step_response: lower,
          });
          return new Response('', { status: 200 });
        }
      }
      // If no running plan, fall through to planning conversation
    }

    // ── Planning conversation ───────────────────────────────
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
        system: `You are CLARA in planning mode for Lee Wakeman, owner of LifeLink Sync (emergency protection platform). You are a strategic thinking partner. NEVER take any action — only think, suggest, develop ideas. Ask good questions. Challenge assumptions. Be concise — WhatsApp format. Help Lee develop the best possible plan. Remind him to say "save [plan name]" when ready. He can also say "list plans" to see saved plans or "execute [plan name]" to run one.`,
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
