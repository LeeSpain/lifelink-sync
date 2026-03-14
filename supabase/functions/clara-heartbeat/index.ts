import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey     = Deno.env.get('RESEND_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Send email via Resend (or stub) ────────────────────────────
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!resendApiKey) {
    console.log(`[STUB] Would email ${to}: ${subject}`);
    return true;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lee from LifeLink Sync <lee@lifelink-sync.com>',
      to: [to],
      subject,
      text: body,
    }),
  });
  if (!response.ok) {
    console.error(`Resend error for ${to}:`, await response.text());
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('clara-heartbeat invoked');

  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const results = {
      inactive_trials: { found: 0, contacted: 0 },
      inactive_subscribers: { found: 0, contacted: 0 },
      quiet_leads: { found: 0, contacted: 0 },
    };

    // ── 1. Inactive trial users (no activity 48h+) ─────────────
    const { data: inactiveTrials } = await supabase
      .from('trial_tracking')
      .select('user_id')
      .eq('status', 'active')
      .lt('created_at', fortyEightHoursAgo);

    if (inactiveTrials?.length) {
      results.inactive_trials.found = inactiveTrials.length;

      for (const trial of inactiveTrials) {
        // 48h dedup check via memory
        const { data: mem } = await supabase
          .from('clara_contact_memory')
          .select('last_contact_at')
          .eq('user_id', trial.user_id)
          .maybeSingle();

        if (mem?.last_contact_at && new Date(mem.last_contact_at).getTime() > now.getTime() - 48 * 60 * 60 * 1000) {
          continue; // contacted within 48h, skip
        }

        // Get email
        const { data: sub } = await supabase
          .from('subscribers')
          .select('email')
          .eq('user_id', trial.user_id)
          .maybeSingle();

        if (!sub?.email) continue;

        const sent = await sendEmail(
          sub.email,
          'Everything OK? Your LifeLink Sync trial is waiting',
          `Hi there,

I noticed you started your LifeLink Sync trial but haven't been back in a couple of days. Everything OK?

If you got stuck setting up, I'm here to help. Just reply to this email and I'll walk you through it personally.

Your trial is still active — and the protection is there waiting for you. All it takes is setting up your emergency contacts and you're covered.

Start here: https://lifelink-sync.com/dashboard

Lee Wakeman
Founder, LifeLink Sync`
        );

        if (sent) {
          results.inactive_trials.contacted++;
          try {
            await supabase.functions.invoke('clara-memory', {
              body: {
                action: 'upsert',
                session_id: `heartbeat-trial-${trial.user_id}`,
                user_id: trial.user_id,
                last_outcome: 'heartbeat: inactive trial check-in sent',
              },
            });
          } catch { /* non-fatal */ }
        }
      }
    }

    // ── 2. Inactive subscribers (no login 14 days+) ────────────
    const { data: inactiveSubs } = await supabase
      .from('subscribers')
      .select('user_id, email')
      .eq('subscribed', true)
      .lt('updated_at', fourteenDaysAgo);

    if (inactiveSubs?.length) {
      results.inactive_subscribers.found = inactiveSubs.length;

      for (const sub of inactiveSubs) {
        // 48h dedup
        const { data: mem } = await supabase
          .from('clara_contact_memory')
          .select('last_contact_at')
          .eq('user_id', sub.user_id)
          .maybeSingle();

        if (mem?.last_contact_at && new Date(mem.last_contact_at).getTime() > now.getTime() - 48 * 60 * 60 * 1000) {
          continue;
        }

        if (!sub.email) continue;

        const sent = await sendEmail(
          sub.email,
          'We miss you at LifeLink Sync',
          `Hi there,

It's been a little while since you last logged into LifeLink Sync and I wanted to check in.

Your emergency protection is still active — your contacts will still be notified if you trigger an SOS. But there are features you might be missing:

- Daily wellbeing check-ins with CLARA
- Updated GPS location sharing
- Family circle notifications

Log in anytime: https://lifelink-sync.com/dashboard

If anything has changed or you have questions, just reply. I read every email.

Lee Wakeman
Founder, LifeLink Sync`
        );

        if (sent) {
          results.inactive_subscribers.contacted++;
          try {
            await supabase.functions.invoke('clara-memory', {
              body: {
                action: 'upsert',
                session_id: `heartbeat-sub-${sub.user_id}`,
                user_id: sub.user_id,
                last_outcome: 'heartbeat: inactive subscriber check-in sent',
              },
            });
          } catch { /* non-fatal */ }
        }
      }
    }

    // ── 3. Quiet leads (score 5+, no contact 48h+) ─────────────
    const { data: quietLeads } = await supabase
      .from('clara_contact_memory')
      .select('id, contact_email, first_name, protecting, pain_point, journey_stage, peak_interest_score, last_contact_at')
      .gte('peak_interest_score', 5)
      .lt('last_contact_at', fortyEightHoursAgo)
      .not('journey_stage', 'in', '("converted","churned")');

    if (quietLeads?.length) {
      results.quiet_leads.found = quietLeads.length;

      for (const lead of quietLeads) {
        if (!lead.contact_email) continue;

        // Build personalized message
        const name = lead.first_name ?? 'there';
        const protectLine = lead.protecting
          ? `I remember you were looking into protection for ${lead.protecting === 'elderly_parent' ? 'a parent' : lead.protecting === 'self' ? 'yourself' : 'your family'}. `
          : '';

        const sent = await sendEmail(
          lead.contact_email,
          `Still thinking about LifeLink Sync, ${name}?`,
          `Hi ${name},

We spoke recently and I wanted to follow up. ${protectLine}

The free 7-day trial is still available — no card needed, takes 2 minutes. You get full access to everything: SOS alerts, GPS tracking, CLARA AI, and your first Family Link free.

Start here: https://lifelink-sync.com

If you had any questions or concerns, just reply and I'll answer personally.

Lee Wakeman
Founder, LifeLink Sync`
        );

        if (sent) {
          results.quiet_leads.contacted++;
          try {
            await supabase
              .from('clara_contact_memory')
              .update({ last_contact_at: now.toISOString(), updated_at: now.toISOString() })
              .eq('id', lead.id);
          } catch { /* non-fatal */ }
        }
      }
    }

    console.log('Heartbeat results:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clara-heartbeat error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
