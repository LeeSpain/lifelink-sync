import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom   = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
  });
};

// ── Write a command for Riven to execute ────────────────────
async function writeCommand(type: string, data: object, priority = 3) {
  const { data: cmd } = await supabase.from('clara_riven_commands').insert({
    command_type: type,
    command_data: data,
    priority,
    status: 'pending',
  }).select('id').single();
  return cmd?.id;
}

// ── Process pending commands ────────────────────────────────
async function processCommands(): Promise<number> {
  const { data: commands } = await supabase
    .from('clara_riven_commands')
    .select('*')
    .eq('status', 'pending')
    .order('priority')
    .order('created_at')
    .limit(10);

  if (!commands?.length) return 0;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` };

  for (const cmd of commands) {
    await supabase.from('clara_riven_commands')
      .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
      .eq('id', cmd.id);

    try {
      let result: Record<string, unknown> = {};

      switch (cmd.command_type) {
        case 'send_email': {
          await fetch(`${supabaseUrl}/functions/v1/clara-email-engine`, {
            method: 'POST', headers,
            body: JSON.stringify({ action: 'send_single', ...cmd.command_data }),
          });
          result = { sent: true };
          break;
        }
        case 'run_campaign': {
          await fetch(`${supabaseUrl}/functions/v1/clara-marketing`, {
            method: 'POST', headers,
            body: JSON.stringify({ from: Deno.env.get('TWILIO_WHATSAPP_LEE'), body: `campaign ${JSON.stringify(cmd.command_data)}` }),
          });
          result = { routed: 'clara-marketing' };
          break;
        }
        case 'dm_response': {
          const data = cmd.command_data as Record<string, string>;
          if (data.channel === 'whatsapp' && data.to) {
            const to = data.to.startsWith('whatsapp:') ? data.to : `whatsapp:${data.to}`;
            await sendWhatsApp(to, data.message || '');
            result = { sent: true, channel: 'whatsapp' };
          }
          break;
        }
        case 'post_content': {
          // Queue to social_media_accounts if connected, otherwise log
          await supabase.from('riven_performance').insert({
            content_type: (cmd.command_data as Record<string, string>).platform || 'social',
            content_preview: (cmd.command_data as Record<string, string>).content?.substring(0, 200),
            audience_segment: 'organic',
            period_start: new Date().toISOString(),
          });
          result = { queued: true };
          break;
        }
        case 'report_request': {
          await fetch(`${supabaseUrl}/functions/v1/clara-cmo-report`, {
            method: 'POST', headers,
            body: JSON.stringify({ action: 'send_report' }),
          });
          result = { routed: 'clara-cmo-report' };
          break;
        }
        case 'budget_adjust': {
          const budgetData = cmd.command_data as Record<string, unknown>;
          await supabase.from('clara_budget')
            .update({ limit_amount: budgetData.new_limit, updated_at: new Date().toISOString() })
            .eq('budget_type', budgetData.budget_type);
          result = { adjusted: true };
          break;
        }
        case 'pause_campaign': {
          await supabase.from('clara_campaign_log')
            .update({ status: 'cancelled' })
            .eq('id', (cmd.command_data as Record<string, string>).campaign_id);
          result = { paused: true };
          break;
        }
        default:
          result = { unknown_type: cmd.command_type };
      }

      await supabase.from('clara_riven_commands').update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        result,
      }).eq('id', cmd.id);

    } catch (e) {
      await supabase.from('clara_riven_commands').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_text: (e as Error).message,
      }).eq('id', cmd.id);
    }
  }

  return commands.length;
}

serve(async (req) => {
  try {
    const body = await req.json();

    if (body.action === 'process_commands') {
      const count = await processCommands();
      return new Response(JSON.stringify({ success: true, processed: count }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'write_command') {
      const id = await writeCommand(body.command_type, body.command_data, body.priority);
      return new Response(JSON.stringify({ success: true, command_id: id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'status') {
      const { count: pending } = await supabase.from('clara_riven_commands').select('id', { count: 'exact' }).eq('status', 'pending');
      const { count: completed } = await supabase.from('clara_riven_commands').select('id', { count: 'exact' }).eq('status', 'complete');
      const { count: failed } = await supabase.from('clara_riven_commands').select('id', { count: 'exact' }).eq('status', 'failed');

      return new Response(JSON.stringify({ pending, completed, failed }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('clara-riven error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
