import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString(),
  });
};

// ── Budget check (called by other functions before spend) ───
async function checkBudget(budgetType: string, estimatedCost: number, alertPhone?: string): Promise<boolean> {
  const { data: budget } = await supabase
    .from('clara_budget')
    .select('*')
    .eq('budget_type', budgetType)
    .maybeSingle();

  if (!budget) return true; // No budget set = no limit

  if (budget.is_locked) {
    if (alertPhone) await sendWhatsApp(alertPhone, `⛔ Budget locked for ${budgetType}. Action blocked.`);
    return false;
  }

  const projectedSpend = (budget.spent_amount || 0) + estimatedCost;

  if (projectedSpend > budget.limit_amount) {
    if (alertPhone) {
      await sendWhatsApp(alertPhone,
        `💰 Budget limit reached: ${budgetType}\nLimit: €${budget.limit_amount}\nSpent: €${budget.spent_amount}\nRequested: €${estimatedCost}\n\nReply APPROVE to override or adjust the budget.`
      );
    }
    return false;
  }

  if (projectedSpend / budget.limit_amount >= budget.alert_threshold) {
    if (alertPhone) {
      await sendWhatsApp(alertPhone,
        `⚠️ Budget at ${Math.round((projectedSpend / budget.limit_amount) * 100)}%: ${budgetType}\n€${projectedSpend.toFixed(2)} of €${budget.limit_amount}`
      );
    }
  }

  // Record spend
  await supabase.from('clara_budget').update({
    spent_amount: projectedSpend,
    updated_at: new Date().toISOString(),
  }).eq('budget_type', budgetType);

  return true;
}

serve(async (req) => {
  try {
    const body = await req.json();
    const from = body.from || Deno.env.get('TWILIO_WHATSAPP_LEE')!;
    const msg = (body.body || body.message || '').toLowerCase().trim();

    // ── Show budget status ──────────────────────────────
    if (body.action === 'status' || msg === 'budget' || msg === 'show budget') {
      const { data: budgets } = await supabase
        .from('clara_budget')
        .select('*')
        .order('budget_type');

      if (!budgets?.length) {
        await sendWhatsApp(from, '💰 No budgets configured.');
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      const lines = budgets.map(b => {
        const pct = b.limit_amount > 0 ? Math.round((b.spent_amount / b.limit_amount) * 100) : 0;
        const bar = pct >= 80 ? '🔴' : pct >= 50 ? '🟡' : '🟢';
        return `${bar} ${b.budget_type}:\n  €${(b.spent_amount || 0).toFixed(2)}/€${b.limit_amount} (${pct}%)${b.is_locked ? ' 🔒 LOCKED' : ''}`;
      });

      await sendWhatsApp(from,
        `💰 BUDGET STATUS\n\n${lines.join('\n\n')}\n\nSay "set [type] budget to €[amount]" to adjust.\nSay "lock budget" to pause all spending.`
      );
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── Set budget ──────────────────────────────────────
    if (body.action === 'set_budget' || msg.startsWith('set ')) {
      const match = msg.match(/set\s+(\w+[\s_]*\w*)\s+budget\s+to\s+[€$]?(\d+(?:\.\d+)?)/i);
      if (match) {
        const budgetType = match[1].trim().replace(/\s+/g, '_');
        const newLimit = parseFloat(match[2]);

        const { error } = await supabase
          .from('clara_budget')
          .update({ limit_amount: newLimit, updated_at: new Date().toISOString() })
          .eq('budget_type', budgetType);

        if (error) {
          await sendWhatsApp(from, `❌ Budget type "${budgetType}" not found.`);
        } else {
          await sendWhatsApp(from, `✅ ${budgetType} budget set to €${newLimit.toFixed(2)}`);
        }
      } else {
        await sendWhatsApp(from, 'Format: "set weekly_campaigns budget to €100"');
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── Lock all budgets ────────────────────────────────
    if (body.action === 'lock' || msg === 'lock budget' || msg === 'pause spending') {
      await supabase.from('clara_budget').update({ is_locked: true, updated_at: new Date().toISOString() }).neq('budget_type', '');
      await sendWhatsApp(from, '⛔ All budgets locked. CLARA cannot spend until unlocked.\nSay "unlock budget" to resume.');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── Unlock all budgets ──────────────────────────────
    if (body.action === 'unlock' || msg === 'unlock budget' || msg === 'resume spending') {
      await supabase.from('clara_budget').update({ is_locked: false, updated_at: new Date().toISOString() }).neq('budget_type', '');
      await sendWhatsApp(from, '✅ Budgets unlocked. CLARA can spend again.');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── Check budget (called programmatically) ──────────
    if (body.action === 'check') {
      const allowed = await checkBudget(body.budget_type, body.estimated_cost, body.alert_phone);
      return new Response(JSON.stringify({ allowed }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Try: status, set_budget, lock, unlock, check' }), { status: 400 });
  } catch (error) {
    console.error('clara-budget-control error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
