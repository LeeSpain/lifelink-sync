import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const twilioSid          = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken        = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom         = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const twilioLee          = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EscalationRequest {
  type: 'hot_lead' | 'amber' | 'morning_briefing';
  lead_id?: string;
  session_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  interest_score?: number;
  protecting?: string;
  protecting_detail?: string;
  trigger_word?: string;
  last_message?: string;
  clara_recommendation?: string;
  custom_message?: string;
}

const sendWhatsApp = async (to: string, from: string, body: string): Promise<boolean> => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const formBody = `To=${encodeURIComponent(to)}&From=${encodeURIComponent(from)}&Body=${encodeURIComponent(body)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Twilio error:', err);
    return false;
  }

  return true;
};

const buildHotLeadMessage = (req: EscalationRequest): string => {
  const score   = req.interest_score ?? 0;
  const name    = req.contact_name ?? 'Unknown';
  const email   = req.contact_email ?? 'not provided';
  const phone   = req.contact_phone ?? 'not provided';
  const protect = req.protecting_detail ?? req.protecting ?? 'not stated';
  const msg     = req.last_message ?? 'not captured';
  const rec     = req.clara_recommendation ?? 'Follow up now';

  return [
    '🔥 HOT LEAD ALERT — LifeLink Sync',
    '',
    `Score: ${score}/10`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Protecting: ${protect}`,
    '',
    `Last message: "${msg}"`,
    '',
    `CLARA recommends: ${rec}`,
    '',
    'Reply YES to have CLARA book a callback',
    'Reply NO to continue email sequence',
  ].join('\n');
};

const buildAmberMessage = (req: EscalationRequest): string => {
  const name    = req.contact_name ?? 'Unknown';
  const email   = req.contact_email ?? 'not provided';
  const trigger = req.trigger_word ?? 'unknown trigger';
  const msg     = req.last_message ?? 'not captured';
  const rec     = req.clara_recommendation ?? 'Handle personally';

  return [
    '🟡 CLARA ESCALATION — Action needed',
    '',
    `Trigger: "${trigger}"`,
    `Contact: ${name}`,
    `Email: ${email}`,
    '',
    `Last message: "${msg}"`,
    '',
    `CLARA recommends: ${rec}`,
    '',
    'Reply YES to approve CLARA handling',
    'Reply NO to hold — you will take over',
    'Reply CALL to trigger instant callback',
  ].join('\n');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EscalationRequest = await req.json();

    if (!body.type) {
      return new Response(
        JSON.stringify({ error: 'type is required: hot_lead, amber, or morning_briefing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let message = '';

    if (body.type === 'hot_lead') {
      message = buildHotLeadMessage(body);
    } else if (body.type === 'amber') {
      message = buildAmberMessage(body);
    } else if (body.type === 'morning_briefing') {
      message = body.custom_message ?? '☀️ LifeLink Sync — Morning briefing ready.';
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sent = await sendWhatsApp(twilioLee, twilioFrom, message);

    if (!sent) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp send failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log escalation in leads table if lead_id provided
    if (body.lead_id) {
      await supabase
        .from('leads')
        .update({
          status: body.type === 'hot_lead' ? 'qualified' : 'amber_escalation',
          metadata: {
            escalated_at: new Date().toISOString(),
            escalation_type: body.type,
            whatsapp_sent: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.lead_id);
    }

    // Log in clara_contact_memory
    if (body.session_id) {
      await supabase.functions.invoke('clara-memory', {
        body: {
          action: 'upsert',
          session_id: body.session_id,
          amber_triggered: body.type === 'amber',
          amber_trigger_word: body.trigger_word ?? null,
          last_outcome: `Escalated to Lee — ${body.type}`,
          interest_score: body.interest_score ?? 0,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, type: body.type, sent_to: twilioLee }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clara-escalation error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
