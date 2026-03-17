// System Health Check — tests all critical services, instant alert if down
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { alertLee, cetTime } from '../_shared/alertLee.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

interface HealthResult { name: string; status: 'ok' | 'down' | 'slow'; latencyMs?: number; detail?: string }

async function check(name: string, fn: () => Promise<any>, timeoutMs = 5000): Promise<HealthResult> {
  const start = Date.now();
  try {
    await Promise.race([fn(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))]);
    const ms = Date.now() - start;
    return { name, status: ms > 3000 ? 'slow' : 'ok', latencyMs: ms };
  } catch (e: any) {
    return { name, status: 'down', detail: e.message, latencyMs: Date.now() - start };
  }
}

serve(async () => {
  const checks: HealthResult[] = [];

  // Database
  checks.push(await check('Database', () => supabase.from('subscribers').select('id', { count: 'exact', head: true })));

  // Auth
  checks.push(await check('Auth Service', () => supabase.auth.getSession()));

  // Website
  checks.push(await check('Website', () => fetch('https://lifelink-sync.com', { method: 'HEAD' }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })));

  // Stripe
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (stripeKey) {
    checks.push(await check('Stripe', () => fetch('https://api.stripe.com/v1/balance', { headers: { 'Authorization': `Bearer ${stripeKey}` } }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })));
  }

  // Twilio
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (twilioSid && twilioToken) {
    checks.push(await check('Twilio', () => fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, { headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`) } }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })));
  }

  // Anthropic
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    checks.push(await check('Anthropic Claude', () => fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'ping' }] }) }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })));
  }

  const down = checks.filter(c => c.status === 'down');
  const slow = checks.filter(c => c.status === 'slow');
  const allOk = down.length === 0;

  const statusLine = (c: HealthResult) => {
    const icon = c.status === 'ok' ? '\u{2705}' : c.status === 'slow' ? '\u{26A0}\u{FE0F}' : '\u{1F534}';
    return `${icon} ${c.name}${c.latencyMs ? ` (${c.latencyMs}ms)` : ''}${c.detail ? ` \u2014 ${c.detail}` : ''}`;
  };

  const report = `\u{1F3E5} SYSTEM HEALTH CHECK\n${cetTime()} CET\n${'━'.repeat(22)}\n\n` +
    checks.map(statusLine).join('\n') + '\n\n' +
    (allOk ? `\u{2705} All ${checks.length} systems operational` : `\u{1F534} ${down.length} system${down.length > 1 ? 's' : ''} DOWN`) +
    (slow.length > 0 ? `\n\u{26A0}\u{FE0F} ${slow.length} running slow` : '');

  // Instant alert if anything is down
  if (down.length > 0) {
    await alertLee(
      `\u{1F6A8} SYSTEM ALERT \u2014 ${down.length} SERVICE${down.length > 1 ? 'S' : ''} DOWN\n\n` +
      down.map(c => `\u{1F534} ${c.name}: ${c.detail || 'not responding'}`).join('\n') +
      `\n\n\u{23F0} ${cetTime()} CET\nCLARA is investigating.`
    );
  }

  return new Response(JSON.stringify({ success: true, allOk, checks, report, downCount: down.length, slowCount: slow.length }), { headers: { 'Content-Type': 'application/json' } });
});
