import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const adminNumber = Deno.env.get('ADMIN_WHATSAPP_NUMBER')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sendWhatsApp = async (to: string, body: string) => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
  });
};

const interpretIntent = async (command: string): Promise<{intent: string, description: string, risk_level: string, confirmation_question: string}> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are CLARA, the AI for LifeLink Sync. Lee (the owner) has sent a dev command via WhatsApp. Interpret it and respond in JSON only.

Command: "${command}"

Respond with JSON only:
{
  "intent": "one line technical description",
  "description": "plain English of what will change",
  "risk_level": "low|medium|high",
  "confirmation_question": "short confirmation message to send Lee, max 2 sentences"
}

Risk levels:
- low: text/style changes, copy updates
- medium: component changes, new features
- high: DB changes, auth changes, payment changes`
      }],
    }),
  });
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse Twilio webhook
    const formData = await req.formData();
    const fromNumber = formData.get('From') as string;
    const messageBody = (formData.get('Body') as string)?.trim();

    // ── HARD AUTH CHECK ──────────────────────────────
    const normalizedFrom = fromNumber?.replace('whatsapp:', '');
    const normalizedAdmin = adminNumber?.replace('whatsapp:', '');

    if (normalizedFrom !== normalizedAdmin) {
      console.log(`Rejected message from ${fromNumber} — not admin`);
      await supabase.from('security_audit_log').insert({
        event_type: 'dev_agent_rejected',
        metadata: { from: fromNumber, reason: 'not_admin' }
      });
      return new Response('', { status: 200 });
    }

    // ── RATE LIMIT: 20 commands per 24 hours ─────────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('dev_agent_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    if ((count ?? 0) >= 20) {
      await sendWhatsApp(fromNumber, "Daily limit reached (20 commands). Try again tomorrow.");
      return new Response('', { status: 200 });
    }

    // ── CHECK FOR PENDING SESSION ─────────────────────
    const { data: pendingSession } = await supabase
      .from('dev_agent_sessions')
      .select('*')
      .eq('status', 'awaiting_confirm')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingSession) {
      const reply = messageBody?.toLowerCase();

      if (reply === 'yes' || reply === 'y') {
        // Confirmed — update session
        await supabase.from('dev_agent_sessions')
          .update({ status: 'confirmed' })
          .eq('id', pendingSession.id);

        await supabase.from('dev_agent_log')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', pendingSession.log_id);

        await sendWhatsApp(fromNumber,
          "On it 🛠️ I'll message you when the PR is ready. This usually takes 1-3 minutes."
        );

        // GitHub integration will be wired here once GitHub App is set up
        // For now log that CC would be called
        await supabase.from('dev_agent_log')
          .update({
            status: 'pending_github_setup',
            error_message: 'GitHub App not yet configured — set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_INSTALLATION_ID secrets to enable code execution'
          })
          .eq('id', pendingSession.log_id);

        await sendWhatsApp(fromNumber,
          "⚠️ GitHub App not configured yet. Set up the GitHub App and add the 3 secrets to complete activation. The intent was logged: " + pendingSession.clara_intent
        );

      } else if (reply === 'no' || reply === 'cancel') {
        await supabase.from('dev_agent_sessions')
          .update({ status: 'cancelled' })
          .eq('id', pendingSession.id);
        await supabase.from('dev_agent_log')
          .update({ status: 'cancelled' })
          .eq('id', pendingSession.log_id);
        await sendWhatsApp(fromNumber, "Cancelled. What else can I help with?");

      } else {
        await sendWhatsApp(fromNumber,
          `You have a pending action: "${pendingSession.command_text}"\nReply YES to confirm or NO to cancel.`
        );
      }

      return new Response('', { status: 200 });
    }

    // ── NEW COMMAND ───────────────────────────────────
    const { intent, description, risk_level, confirmation_question } =
      await interpretIntent(messageBody);

    // Create log entry
    const { data: logEntry } = await supabase
      .from('dev_agent_log')
      .insert({
        session_id: crypto.randomUUID(),
        command_text: messageBody,
        clara_intent: intent,
        status: 'pending_confirm',
      })
      .select()
      .single();

    // Create session
    await supabase.from('dev_agent_sessions').insert({
      command_text: messageBody,
      clara_intent: intent,
      status: 'awaiting_confirm',
      log_id: logEntry?.id,
    });

    // Send confirmation to Lee
    const riskEmoji = risk_level === 'high' ? '🔴' : risk_level === 'medium' ? '🟡' : '🟢';
    await sendWhatsApp(fromNumber,
      `${riskEmoji} ${confirmation_question}\n\nReply YES to proceed or NO to cancel.`
    );

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('clara-dev-agent error:', error);
    return new Response('', { status: 200 });
  }
});
