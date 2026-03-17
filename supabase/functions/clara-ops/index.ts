import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom   = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
    }
  );
  if (!res.ok) console.error('Twilio send failed:', res.status, await res.text());
};

// ── Detect ops command ──────────────────────────────────────
type OpsAction = 'health' | 'payments' | 'churn' | 'errors' | 'users' | 'unknown';

function detectOpsAction(msg: string): OpsAction {
  const m = msg.toLowerCase();
  if (/\b(health|status|system|uptime|alive|running|check)\b/.test(m)) return 'health';
  if (/\b(payment|failed payment|billing|stripe|charge|declined|invoice)\b/.test(m)) return 'payments';
  if (/\b(churn|cancel|unsubscribe|leaving|lost|attrition|retention)\b/.test(m)) return 'churn';
  if (/\b(error|bug|crash|exception|fail|broken|500|4[0-9]{2})\b/.test(m)) return 'errors';
  if (/\b(user|member|account|profile|signup|registration|active)\b/.test(m)) return 'users';
  return 'unknown';
}

// ── Action handlers ─────────────────────────────────────────

async function handleHealth(): Promise<{ proposal: string; data: unknown }> {
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();

  // Check key metrics
  const { count: waMessages24h } = await supabase
    .from('whatsapp_messages').select('id', { count: 'exact' }).gte('created_at', dayAgo);

  const { count: waMessagesHour } = await supabase
    .from('whatsapp_messages').select('id', { count: 'exact' }).gte('created_at', hourAgo);

  const { count: leadsToday } = await supabase
    .from('leads').select('id', { count: 'exact' }).gte('created_at', dayAgo);

  const { count: activeSubs } = await supabase
    .from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);

  const { count: activeTrials } = await supabase
    .from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');

  const { count: pendingTasks } = await supabase
    .from('clara_tasks').select('id', { count: 'exact' }).eq('status', 'pending');

  // Check for recent errors in ops log
  const { count: recentErrors } = await supabase
    .from('clara_ops_log').select('id', { count: 'exact' })
    .eq('severity', 'critical').eq('resolved', false);

  // Check edge function heartbeat
  const { data: heartbeat } = await supabase
    .from('clara_heartbeat')
    .select('last_beat')
    .order('last_beat', { ascending: false })
    .limit(1)
    .maybeSingle();

  const heartbeatOk = heartbeat?.last_beat
    ? (Date.now() - new Date(heartbeat.last_beat).getTime()) < 600000 // 10 min
    : false;

  const status = (recentErrors ?? 0) > 0 ? '🔴 ISSUES DETECTED' : '🟢 ALL SYSTEMS GO';

  return {
    proposal: `⚙️ PLATFORM HEALTH ${status}\n\nCLARA heartbeat: ${heartbeatOk ? '✅ Online' : '⚠️ Stale'}\nWhatsApp (24h): ${waMessages24h ?? 0} messages\nWhatsApp (1h): ${waMessagesHour ?? 0} messages\nNew leads today: ${leadsToday ?? 0}\nActive subscribers: ${activeSubs ?? 0}\nActive trials: ${activeTrials ?? 0}\nPending tasks: ${pendingTasks ?? 0}\nUnresolved alerts: ${recentErrors ?? 0}`,
    data: null,
  };
}

async function handlePayments(): Promise<{ proposal: string; data: unknown }> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Check for failed payments
  const { data: failedPayments } = await supabase
    .from('payment_events')
    .select('id, user_id, amount, currency, status, created_at, metadata')
    .eq('status', 'failed')
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: totalFailed } = await supabase
    .from('payment_events').select('id', { count: 'exact' })
    .eq('status', 'failed').gte('created_at', weekAgo);

  const { count: totalSuccessful } = await supabase
    .from('payment_events').select('id', { count: 'exact' })
    .eq('status', 'succeeded').gte('created_at', weekAgo);

  const failedCount = totalFailed ?? 0;
  const successCount = totalSuccessful ?? 0;
  const total = failedCount + successCount;
  const failRate = total > 0 ? ((failedCount / total) * 100).toFixed(1) : '0';

  if (failedCount === 0) {
    return {
      proposal: `💳 PAYMENTS (7 days)\n\nSuccessful: ${successCount}\nFailed: 0\nFailure rate: 0%\n\n✅ No payment issues.`,
      data: null,
    };
  }

  const list = (failedPayments || []).slice(0, 5).map((p, i) =>
    `${i + 1}. €${(p.amount / 100).toFixed(2)} — ${new Date(p.created_at).toLocaleDateString()}`
  ).join('\n');

  return {
    proposal: `💳 PAYMENTS (7 days)\n\nSuccessful: ${successCount}\nFailed: ${failedCount}\nFailure rate: ${failRate}%\n\nRecent failures:\n${list}\n\nReply YES to retry failed payments, or NO to skip.`,
    data: failedCount > 0 ? { action: 'retry_payments', payment_ids: failedPayments?.map(p => p.id) || [] } : null,
  };
}

async function handleChurn(): Promise<{ proposal: string; data: unknown }> {
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Expired trials (potential churn)
  const { data: expiredTrials } = await supabase
    .from('trial_tracking')
    .select('id, user_id, phone, created_at, expired_at')
    .eq('status', 'expired')
    .gte('expired_at', monthAgo)
    .order('expired_at', { ascending: false })
    .limit(20);

  // Recent cancellations
  const { count: cancellations } = await supabase
    .from('subscribers').select('id', { count: 'exact' })
    .eq('subscribed', false)
    .gte('updated_at', monthAgo);

  // Active vs total
  const { count: activeSubs } = await supabase
    .from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);

  const { count: totalSubs } = await supabase
    .from('subscribers').select('id', { count: 'exact' });

  const churnRate = (totalSubs ?? 0) > 0
    ? (((cancellations ?? 0) / (totalSubs ?? 1)) * 100).toFixed(1)
    : '0';

  const expiredCount = expiredTrials?.length ?? 0;

  let churnList = '';
  if (expiredTrials?.length) {
    // Enrich with names
    const enriched = await Promise.all(expiredTrials.slice(0, 10).map(async (t) => {
      let name = t.phone || 'Unknown';
      if (t.phone) {
        const { data: mem } = await supabase
          .from('clara_contact_memory')
          .select('first_name')
          .eq('contact_phone', t.phone)
          .maybeSingle();
        if (mem?.first_name) name = mem.first_name;
      }
      const daysAgo = Math.round((Date.now() - new Date(t.expired_at || t.created_at).getTime()) / 86400000);
      return { ...t, display_name: name, days_ago: daysAgo };
    }));

    churnList = enriched.map((t, i) =>
      `${i + 1}. ${t.display_name} — expired ${t.days_ago}d ago`
    ).join('\n');
  }

  return {
    proposal: `📉 CHURN REPORT (30 days)\n\nActive subscribers: ${activeSubs ?? 0}\nCancellations: ${cancellations ?? 0}\nChurn rate: ${churnRate}%\nExpired trials: ${expiredCount}\n${churnList ? '\nRecent expired trials:\n' + churnList : ''}\n\n${expiredCount > 0 ? 'Reply YES to send win-back messages to expired trials.' : 'No expired trials to chase.'}`,
    data: expiredCount > 0 ? { action: 'winback', trials: expiredTrials?.map(t => ({ id: t.id, phone: t.phone })) } : null,
  };
}

async function handleErrors(): Promise<{ proposal: string; data: unknown }> {
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  // Check ops log for errors
  const { data: errors } = await supabase
    .from('clara_ops_log')
    .select('event_type, severity, details, created_at, resolved')
    .gte('created_at', dayAgo)
    .order('created_at', { ascending: false })
    .limit(10);

  // Check security audit log
  const { count: securityEvents } = await supabase
    .from('security_audit_log').select('id', { count: 'exact' })
    .gte('created_at', dayAgo);

  if (!errors?.length) {
    return {
      proposal: `🔍 ERROR LOG (24h)\n\n✅ No errors logged.\nSecurity events: ${securityEvents ?? 0}\n\nAll systems running normally.`,
      data: null,
    };
  }

  const list = errors.map((e, i) =>
    `${i + 1}. [${e.severity.toUpperCase()}] ${e.event_type} ${e.resolved ? '✅' : '🔴'}\n   ${new Date(e.created_at).toLocaleTimeString()}`
  ).join('\n');

  const unresolved = errors.filter(e => !e.resolved).length;

  return {
    proposal: `🔍 ERROR LOG (24h)\n\n${list}\n\nUnresolved: ${unresolved}\nSecurity events: ${securityEvents ?? 0}\n\n${unresolved > 0 ? 'Reply YES to mark all as resolved.' : 'All resolved.'}`,
    data: unresolved > 0 ? { action: 'resolve_errors' } : null,
  };
}

async function handleUsers(): Promise<{ proposal: string; data: unknown }> {
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { count: totalProfiles } = await supabase
    .from('profiles').select('id', { count: 'exact' });

  const { count: newToday } = await supabase
    .from('profiles').select('id', { count: 'exact' }).gte('created_at', dayAgo);

  const { count: newWeek } = await supabase
    .from('profiles').select('id', { count: 'exact' }).gte('created_at', weekAgo);

  const { count: newMonth } = await supabase
    .from('profiles').select('id', { count: 'exact' }).gte('created_at', monthAgo);

  const { count: activeSubs } = await supabase
    .from('subscribers').select('id', { count: 'exact' }).eq('subscribed', true);

  const { count: activeTrials } = await supabase
    .from('trial_tracking').select('id', { count: 'exact' }).eq('status', 'active');

  const { count: emergencyContacts } = await supabase
    .from('emergency_contacts').select('id', { count: 'exact' });

  return {
    proposal: `👤 USER METRICS\n\nTotal accounts: ${totalProfiles ?? 0}\nNew today: ${newToday ?? 0}\nNew this week: ${newWeek ?? 0}\nNew this month: ${newMonth ?? 0}\n\nActive subscribers: ${activeSubs ?? 0}\nActive trials: ${activeTrials ?? 0}\nEmergency contacts: ${emergencyContacts ?? 0}`,
    data: null,
  };
}

// ── Execute approved actions ────────────────────────────────

async function executeAction(actionData: Record<string, unknown>): Promise<string> {
  const action = actionData.action as string;

  if (action === 'retry_payments') {
    // Log the retry attempt
    await supabase.from('clara_ops_log').insert({
      event_type: 'payment_retry',
      severity: 'info',
      details: { payment_ids: actionData.payment_ids },
    });

    return '✅ Payment retry requested. (Stripe webhook will handle actual retry — this has been logged for follow-up.)';
  }

  if (action === 'winback') {
    const trials = (actionData.trials as Array<{ id: string; phone: string }>) || [];
    let sent = 0;

    for (const trial of trials) {
      if (trial.phone) {
        try {
          const to = trial.phone.startsWith('whatsapp:') ? trial.phone : `whatsapp:${trial.phone}`;
          await sendWhatsApp(to,
            `Hi! It's CLARA from LifeLink Sync. Your free trial ended but we'd love to have you back. We've been making improvements and your family's safety matters to us. Reply YES to restart your trial — no charge. 🛡️`
          );
          sent++;
        } catch { /* continue */ }
      }
    }

    await supabase.from('clara_ops_log').insert({
      event_type: 'winback_campaign',
      severity: 'info',
      details: { total: trials.length, sent },
    });

    return `✅ Win-back messages sent to ${sent} of ${trials.length} expired trials.`;
  }

  if (action === 'resolve_errors') {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    await supabase.from('clara_ops_log')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('resolved', false)
      .gte('created_at', dayAgo);

    return '✅ All errors marked as resolved.';
  }

  return '✅ Action completed.';
}

// ── Main handler ────────────────────────────────────────────

serve(async (req) => {
  try {
    const { from, body: msg } = await req.json();
    const lower = msg.toLowerCase().trim();

    // ── Check for YES/NO approval ────────────────────────
    if (lower === 'yes' || lower === 'y' || lower === '👍') {
      const { data: pending } = await supabase
        .from('clara_pending_actions')
        .select('*')
        .eq('owner_phone', from)
        .eq('status', 'pending')
        .in('action_type', ['payments', 'churn', 'errors'])
        .gt('expires_at', new Date().toISOString())
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pending) {
        await sendWhatsApp(from, 'No pending ops action. What do you need?');
        return new Response('', { status: 200 });
      }

      await supabase.from('clara_pending_actions')
        .update({ status: 'approved', executed_at: new Date().toISOString() })
        .eq('id', pending.id);

      const result = await executeAction(pending.action_data);
      await sendWhatsApp(from, result);
      return new Response('', { status: 200 });
    }

    if (lower === 'no' || lower === 'n' || lower === '❌' || lower === 'cancel') {
      const { data: pending } = await supabase
        .from('clara_pending_actions')
        .select('id')
        .eq('owner_phone', from)
        .eq('status', 'pending')
        .in('action_type', ['payments', 'churn', 'errors'])
        .order('proposed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        await supabase.from('clara_pending_actions')
          .update({ status: 'rejected' })
          .eq('id', pending.id);
      }

      await sendWhatsApp(from, 'Cancelled. What else in ops?');
      return new Response('', { status: 200 });
    }

    // ── Detect and handle ops command ────────────────────
    const actionType = detectOpsAction(msg);
    let result: { proposal: string; data: unknown };

    switch (actionType) {
      case 'health':
        result = await handleHealth();
        break;
      case 'payments':
        result = await handlePayments();
        break;
      case 'churn':
        result = await handleChurn();
        break;
      case 'errors':
        result = await handleErrors();
        break;
      case 'users':
        result = await handleUsers();
        break;
      default: {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: `You are CLARA in ops mode for Lee Wakeman, owner of LifeLink Sync. Respond concisely. If you can't help, suggest: health, payments, churn, errors, users.`,
            messages: [{ role: 'user', content: msg }],
          }),
        });
        const aiData = await aiRes.json();
        await sendWhatsApp(from, aiData.content?.[0]?.text || 'I can help with: health, payments, churn, errors, users. What do you need?');
        return new Response('', { status: 200 });
      }
    }

    // Send proposal
    await sendWhatsApp(from, result.proposal);

    // Store pending action (only if there's data to act on)
    if (result.data) {
      await supabase.from('clara_pending_actions').insert({
        owner_phone: from,
        action_type: actionType,
        action_data: result.data,
        proposal_text: result.proposal,
        status: 'pending',
      });
    }

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('clara-ops error:', error);
    return new Response('', { status: 200 });
  }
});
