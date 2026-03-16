import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid    = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom   = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const leePhone     = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

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

// ── Step type definition ────────────────────────────────────
interface PlanStep {
  step_number: number;
  description: string;
  action_type: string; // campaign|outreach|content|email|whatsapp|db_update|report|manual|decision
  details: string;
  requires_approval: boolean;
  estimated_duration: string;
}

// ── Parse plan into steps via Claude ────────────────────────
async function parsePlanIntoSteps(planContent: string): Promise<PlanStep[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are CLARA, LifeLink Sync's AI operator.
Read this plan and extract every actionable step as a structured list.

Plan: ${planContent}

For each step produce:
{
  "step_number": 1,
  "description": "short label",
  "action_type": "campaign|outreach|content|email|whatsapp|db_update|report|manual|decision",
  "details": "exactly what to do",
  "requires_approval": true/false,
  "estimated_duration": "10 mins"
}

Rules:
- requires_approval = true for anything that sends messages, spends money, or modifies data
- requires_approval = false for reports, analysis, content drafting
- action_type = "manual" if Lee needs to do something himself
- Be specific in details — CLARA will execute from this text alone
- If the plan is vague, break it into logical steps anyway

Respond with JSON array only.`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse plan into steps');
  return JSON.parse(jsonMatch[0]);
}

// ── Execute a single step ───────────────────────────────────
async function executeStep(
  step: PlanStep,
  executionId: string,
  from: string
): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` };

  switch (step.action_type) {
    case 'campaign': {
      // Route to clara-marketing
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-marketing`, {
          method: 'POST', headers,
          body: JSON.stringify({ from, body: step.details }),
        });
        return `Campaign step routed to marketing mode: "${step.details.substring(0, 80)}"`;
      } catch (e) {
        return `Campaign step failed: ${(e as Error).message}`;
      }
    }

    case 'outreach': {
      // Route to clara-sales chase logic
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-sales`, {
          method: 'POST', headers,
          body: JSON.stringify({ from, body: `chase ${step.details}` }),
        });
        return `Outreach step routed to sales mode: "${step.details.substring(0, 80)}"`;
      } catch (e) {
        return `Outreach step failed: ${(e as Error).message}`;
      }
    }

    case 'email': {
      // Draft and send email via Claude + Resend
      const draftRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 400,
          messages: [{ role: 'user', content: `Draft a professional email for LifeLink Sync based on these instructions: "${step.details}"\n\nRespond with JSON only:\n{"to":"email address or placeholder","subject":"subject line","body":"email body text"}` }],
        }),
      });
      const draftData = await draftRes.json();
      const emailDraft = JSON.parse(draftData.content[0].text.replace(/```json|```/g, '').trim());

      // Send via Resend if available
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey && emailDraft.to && emailDraft.to !== 'placeholder') {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'CLARA — LifeLink Sync <clara@lifelink-sync.com>',
              to: [emailDraft.to],
              subject: emailDraft.subject,
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#0d1b35;padding:24px;text-align:center"><h2 style="color:white;margin:0">LifeLink Sync</h2></div><div style="padding:32px;background:#f8fafc">${emailDraft.body.split('\n').map((p: string) => `<p>${p}</p>`).join('')}</div></div>`,
            }),
          });
          return `Email sent to ${emailDraft.to}: "${emailDraft.subject}"`;
        } catch {
          return `Email drafted but send failed. Subject: "${emailDraft.subject}"`;
        }
      }
      return `Email drafted (RESEND not configured). Subject: "${emailDraft.subject}"`;
    }

    case 'whatsapp': {
      // Draft WhatsApp message via Claude
      const waRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{ role: 'user', content: `Draft a WhatsApp message for LifeLink Sync based on these instructions: "${step.details}"\n\nKeep it under 160 chars, warm and personal. Just the message text, no JSON.` }],
        }),
      });
      const waData = await waRes.json();
      const waMessage = waData.content[0].text.replace(/^["']|["']$/g, '').trim();
      return `WhatsApp message drafted: "${waMessage.substring(0, 100)}..."`;
    }

    case 'content': {
      // Generate content — never blocks
      const contentRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 600,
          messages: [{ role: 'user', content: `Create marketing content for LifeLink Sync (emergency protection platform, €9.99/mo) based on: "${step.details}"\n\nBe warm, empathetic. Focus on protecting loved ones. Max 200 words.` }],
        }),
      });
      const contentData = await contentRes.json();
      const content = contentData.content[0].text;

      // Send content to Lee
      await sendWhatsApp(from, `📝 Content for step ${step.step_number}:\n\n${content.substring(0, 1400)}`);
      return `Content generated and sent to you`;
    }

    case 'report': {
      // Route to relevant reporting function
      try {
        await fetch(`${supabaseUrl}/functions/v1/clara-ops`, {
          method: 'POST', headers,
          body: JSON.stringify({ from, body: `health ${step.details}` }),
        });
        return `Report generated via ops mode`;
      } catch (e) {
        return `Report generation failed: ${(e as Error).message}`;
      }
    }

    case 'db_update': {
      // Log the requested DB update (don't auto-execute arbitrary SQL)
      await supabase.from('clara_ops_log').insert({
        event_type: 'plan_db_update',
        severity: 'info',
        details: { step: step.step_number, description: step.details, execution_id: executionId },
      });
      return `DB update logged: "${step.details.substring(0, 100)}"`;
    }

    case 'manual': {
      // This is handled by the caller — pause for Lee
      return 'MANUAL_STEP';
    }

    case 'decision': {
      // Analyse options and recommend
      const decisionRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 400,
          messages: [{ role: 'user', content: `You are CLARA, LifeLink Sync's AI. Lee needs a decision on: "${step.details}"\n\nAnalyse the options. Recommend the best choice with reasoning. Be concise — 3 sentences max.` }],
        }),
      });
      const decisionData = await decisionRes.json();
      return decisionData.content[0].text;
    }

    default:
      return `Unknown action type: ${step.action_type}`;
  }
}

// ── Process next step in execution ──────────────────────────
async function processNextStep(executionId: string, from: string) {
  const { data: execution } = await supabase
    .from('clara_plan_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (!execution || execution.status !== 'running') return;

  const stepsLog = (execution.steps_log as PlanStep[]) || [];
  const currentStep = execution.current_step;

  if (currentStep > execution.total_steps) {
    // All steps complete
    await completePlan(executionId, execution.plan_name, execution.plan_id, from);
    return;
  }

  // Find current step from the stored steps
  const { data: approvalCheck } = await supabase
    .from('clara_plan_approvals')
    .select('*')
    .eq('execution_id', executionId)
    .eq('step_number', currentStep)
    .maybeSingle();

  // If there's a pending approval, wait
  if (approvalCheck && approvalCheck.approval_status === 'pending') {
    return; // Still waiting for approval
  }

  // Get step details from the original parsed steps stored in steps_log
  // The steps_log stores completed steps. We need to find the step definition.
  // We'll store full step definitions in next_action as JSON
  let step: PlanStep;
  try {
    const nextActionData = JSON.parse(execution.next_action || '{}');
    step = nextActionData.steps?.[currentStep - 1];
    if (!step) throw new Error('Step not found');
  } catch {
    await sendWhatsApp(from, `⚠️ Could not find step ${currentStep} data. Plan may be corrupted.`);
    return;
  }

  // Check if step requires approval
  if (step.requires_approval) {
    // Check if we already have an approval for this step
    if (!approvalCheck) {
      // Create approval request
      await supabase.from('clara_plan_approvals').insert({
        execution_id: executionId,
        step_number: currentStep,
        step_description: step.description,
        proposed_action: step.details,
        approval_status: 'pending',
      });

      const emoji = step.action_type === 'decision' ? '🤔' : '⚠️';
      let msg = `${emoji} Step ${currentStep}/${execution.total_steps} needs approval:\n\n${step.description}\n\n${step.details}`;

      // For decisions, get CLARA's recommendation
      if (step.action_type === 'decision') {
        const recommendation = await executeStep(step, executionId, from);
        msg += `\n\nCLARA recommends: ${recommendation}`;
      }

      msg += '\n\nReply YES to proceed, NO to skip this step.';
      await sendWhatsApp(from, msg);
      return;
    }

    // If rejected/skipped, log and move on
    if (approvalCheck.approval_status === 'rejected' || approvalCheck.approval_status === 'skipped') {
      const logEntry = {
        step: currentStep,
        description: step.description,
        status: 'skipped',
        result: 'Skipped by Lee',
        completed_at: new Date().toISOString(),
      };

      const updatedLog = [...(execution.steps_log as unknown[]), logEntry];
      await supabase.from('clara_plan_executions').update({
        current_step: currentStep + 1,
        completed_steps: execution.completed_steps,
        current_step_description: `Step ${currentStep} skipped`,
        steps_log: updatedLog,
      }).eq('id', executionId);

      await sendWhatsApp(from, `⏭️ Step ${currentStep}/${execution.total_steps} skipped: ${step.description}`);

      // Process next step
      await processNextStep(executionId, from);
      return;
    }
    // If approved, fall through to execute
  }

  // Handle manual steps
  if (step.action_type === 'manual') {
    // Check if we already sent the manual request
    if (!approvalCheck) {
      await supabase.from('clara_plan_approvals').insert({
        execution_id: executionId,
        step_number: currentStep,
        step_description: step.description,
        proposed_action: step.details,
        approval_status: 'pending',
      });

      await sendWhatsApp(from,
        `👤 Step ${currentStep}/${execution.total_steps} needs you:\n\n${step.description}\n${step.details}\n\nReply DONE when complete or SKIP to move on.`
      );
      return;
    }

    if (approvalCheck.approval_status === 'pending') return;
  }

  // Execute the step
  const result = await executeStep(step, executionId, from);

  // Log completion
  const logEntry = {
    step: currentStep,
    description: step.description,
    status: 'completed',
    result,
    completed_at: new Date().toISOString(),
  };

  const updatedLog = [...(execution.steps_log as unknown[]), logEntry];
  const nextStep = currentStep + 1;

  await supabase.from('clara_plan_executions').update({
    current_step: nextStep,
    completed_steps: execution.completed_steps + 1,
    current_step_description: nextStep <= execution.total_steps ? `Moving to step ${nextStep}` : 'All steps complete',
    steps_log: updatedLog,
  }).eq('id', executionId);

  // Progress report
  if (nextStep <= execution.total_steps) {
    const nextStepData = JSON.parse(execution.next_action || '{}').steps?.[nextStep - 1];
    const nextLabel = nextStepData?.description || 'Next step';
    const needsApproval = nextStepData?.requires_approval || nextStepData?.action_type === 'manual';

    await sendWhatsApp(from,
      `✅ Step ${currentStep}/${execution.total_steps} complete: ${step.description}\nResult: ${result.substring(0, 200)}\n\nNext: Step ${nextStep} — ${nextLabel}\n${needsApproval ? 'Waiting for your approval' : 'Starting now...'}`
    );

    // Continue to next step (small delay to not overwhelm)
    if (!needsApproval) {
      await processNextStep(executionId, from);
    }
  } else {
    // All done
    await completePlan(executionId, execution.plan_name, execution.plan_id, from);
  }
}

// ── Complete a plan execution ───────────────────────────────
async function completePlan(executionId: string, planName: string, planId: string | null, from: string) {
  const { data: execution } = await supabase
    .from('clara_plan_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (!execution) return;

  const log = (execution.steps_log as Array<{ step: number; description: string; status: string; result: string }>) || [];
  const completed = log.filter(s => s.status === 'completed').length;
  const skipped = log.filter(s => s.status === 'skipped').length;

  // Update execution
  await supabase.from('clara_plan_executions').update({
    status: 'complete',
    completed_at: new Date().toISOString(),
  }).eq('id', executionId);

  // Update planning journal
  if (planId) {
    await supabase.from('clara_planning_journal').update({
      status: 'executed',
      updated_at: new Date().toISOString(),
    }).eq('id', planId);
  }

  // Build outcomes
  const outcomes = log
    .filter(s => s.status === 'completed')
    .slice(-3)
    .map(s => `- ${s.description}: ${s.result.substring(0, 80)}`);

  await sendWhatsApp(from,
    `🎉 Plan complete: ${planName}\n\nResults:\n✅ ${completed} steps completed\n⏭️ ${skipped} steps skipped\n\nKey outcomes:\n${outcomes.join('\n') || '- Plan executed'}\n\nPlan marked as complete in your journal. 🛡️`
  );
}

// ── Main handler ────────────────────────────────────────────

serve(async (req) => {
  try {
    const body = await req.json();
    const { action, from, plan_name, execution_id, step_response } = body;

    const senderPhone = from || leePhone;

    // ── ACTION: start — Start executing a named plan ─────
    if (action === 'start') {
      // Find the plan
      const { data: plan } = await supabase
        .from('clara_planning_journal')
        .select('*')
        .ilike('plan_name', `%${plan_name}%`)
        .eq('status', 'saved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        // List available plans
        const { data: allPlans } = await supabase
          .from('clara_planning_journal')
          .select('plan_name, status')
          .order('created_at', { ascending: false })
          .limit(10);

        const list = allPlans?.map((p: { plan_name: string; status: string }) =>
          `• ${p.plan_name} (${p.status})`
        ).join('\n') || 'No plans saved';

        await sendWhatsApp(senderPhone,
          `I couldn't find a saved plan called "${plan_name}".\n\nYour plans:\n${list}\n\nWhich one should I execute?`
        );
        return new Response(JSON.stringify({ success: false, reason: 'plan_not_found' }), { status: 200 });
      }

      // Parse plan into steps
      const steps = await parsePlanIntoSteps(plan.plan_content);

      // Build execution preview
      const stepList = steps.map(s => {
        const emoji = s.action_type === 'manual' ? '👤' : s.requires_approval ? '⚠️' : '✅';
        const label = s.action_type === 'manual' ? 'manual (you)' : s.requires_approval ? 'needs approval' : 'auto';
        return `${s.step_number}. ${emoji} ${s.description} — ${label}`;
      }).join('\n');

      const totalMins = steps.reduce((sum, s) => {
        const mins = parseInt(s.estimated_duration) || 10;
        return sum + mins;
      }, 0);
      const estTime = totalMins >= 60 ? `${Math.round(totalMins / 60)} hours` : `${totalMins} mins`;

      // Store as pending action for YES/NO flow
      await supabase.from('clara_pending_actions').insert({
        owner_phone: senderPhone,
        action_type: 'execute_plan',
        action_data: { plan_id: plan.id, plan_name: plan.plan_name, steps },
        proposal_text: `Execute ${plan.plan_name}`,
        status: 'pending',
      });

      await sendWhatsApp(senderPhone,
        `📋 EXECUTE: ${plan.plan_name}\n\nI found ${steps.length} steps:\n\n${stepList}\n\n✅ = I run automatically\n⚠️ = I'll ask you first\n👤 = Needs you to do it\n\nEstimated time: ${estTime}\n\nReply YES to start or NO to cancel.`
      );

      return new Response(JSON.stringify({ success: true, steps: steps.length }), { status: 200 });
    }

    // ── ACTION: launch — Actually start execution (after YES) ──
    if (action === 'launch') {
      const { plan_id, plan_name: pName, steps } = body;

      // Create execution record
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .insert({
          plan_id,
          plan_name: pName,
          status: 'running',
          total_steps: steps.length,
          completed_steps: 0,
          current_step: 1,
          current_step_description: steps[0]?.description || 'Starting',
          steps_log: [],
          next_action: JSON.stringify({ steps }),
        })
        .select('id')
        .single();

      if (!execution) {
        await sendWhatsApp(senderPhone, '❌ Failed to create execution record.');
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }

      // Update journal to executing
      if (plan_id) {
        await supabase.from('clara_planning_journal').update({
          status: 'executing',
          updated_at: new Date().toISOString(),
        }).eq('id', plan_id);
      }

      await sendWhatsApp(senderPhone, `🚀 Executing "${pName}". Starting step 1 now.`);

      // Start processing
      await processNextStep(execution.id, senderPhone);

      return new Response(JSON.stringify({ success: true, execution_id: execution.id }), { status: 200 });
    }

    // ── ACTION: step_response — Lee responded to a step ─────
    if (action === 'step_response') {
      const response = step_response?.toLowerCase()?.trim();

      // Find running execution
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .select('id, current_step')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!execution) {
        return new Response(JSON.stringify({ success: false, reason: 'no_running_execution' }), { status: 200 });
      }

      // Find pending approval
      const { data: approval } = await supabase
        .from('clara_plan_approvals')
        .select('*')
        .eq('execution_id', execution.id)
        .eq('step_number', execution.current_step)
        .eq('approval_status', 'pending')
        .maybeSingle();

      if (!approval) {
        return new Response(JSON.stringify({ success: false, reason: 'no_pending_approval' }), { status: 200 });
      }

      if (response === 'yes' || response === 'y' || response === '👍' || response === 'done') {
        await supabase.from('clara_plan_approvals').update({
          approval_status: 'approved',
          responded_at: new Date().toISOString(),
        }).eq('id', approval.id);

        await processNextStep(execution.id, senderPhone);
      } else if (response === 'no' || response === 'n' || response === 'skip' || response === '❌') {
        await supabase.from('clara_plan_approvals').update({
          approval_status: response === 'skip' ? 'skipped' : 'rejected',
          responded_at: new Date().toISOString(),
        }).eq('id', approval.id);

        await processNextStep(execution.id, senderPhone);
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── ACTION: status — Check execution progress ───────────
    if (action === 'status') {
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .select('*')
        .in('status', ['running', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!execution) {
        await sendWhatsApp(senderPhone, '📋 No active plan execution. Say "execute [plan name]" to start one.');
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      const elapsed = Math.round((Date.now() - new Date(execution.started_at).getTime()) / 60000);

      await sendWhatsApp(senderPhone,
        `📋 ${execution.plan_name}: Step ${execution.current_step}/${execution.total_steps}\nCurrent: ${execution.current_step_description}\nStatus: ${execution.status}\nCompleted: ${execution.completed_steps} steps\nStarted: ${elapsed} mins ago`
      );

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── ACTION: pause — Pause current execution ─────────────
    if (action === 'pause') {
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .select('id, plan_name, current_step, total_steps')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!execution) {
        await sendWhatsApp(senderPhone, 'No running plan to pause.');
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }

      await supabase.from('clara_plan_executions').update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        paused_reason: 'Paused by Lee',
      }).eq('id', execution.id);

      await sendWhatsApp(senderPhone,
        `⏸️ Plan paused: ${execution.plan_name} at step ${execution.current_step}/${execution.total_steps}.\nSay "resume ${execution.plan_name}" to continue.`
      );

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── ACTION: resume — Resume paused execution ────────────
    if (action === 'resume') {
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .select('id, plan_name, current_step, total_steps')
        .eq('status', 'paused')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!execution) {
        await sendWhatsApp(senderPhone, 'No paused plan to resume.');
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }

      await supabase.from('clara_plan_executions').update({
        status: 'running',
        paused_at: null,
        paused_reason: null,
      }).eq('id', execution.id);

      await sendWhatsApp(senderPhone,
        `▶️ Resuming "${execution.plan_name}" from step ${execution.current_step}/${execution.total_steps}...`
      );

      await processNextStep(execution.id, senderPhone);

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── ACTION: cancel — Cancel current execution ───────────
    if (action === 'cancel') {
      const { data: execution } = await supabase
        .from('clara_plan_executions')
        .select('id, plan_name, completed_steps, total_steps, plan_id')
        .in('status', ['running', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!execution) {
        await sendWhatsApp(senderPhone, 'No active plan to cancel.');
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }

      await supabase.from('clara_plan_executions').update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      }).eq('id', execution.id);

      // Reset journal status back to saved
      if (execution.plan_id) {
        await supabase.from('clara_planning_journal').update({
          status: 'saved',
          updated_at: new Date().toISOString(),
        }).eq('id', execution.plan_id);
      }

      await sendWhatsApp(senderPhone,
        `❌ "${execution.plan_name}" cancelled.\nCompleted ${execution.completed_steps} of ${execution.total_steps} steps.`
      );

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── ACTION: list — List all plans ───────────────────────
    if (action === 'list') {
      const { data: plans } = await supabase
        .from('clara_planning_journal')
        .select('plan_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(15);

      if (!plans?.length) {
        await sendWhatsApp(senderPhone, '📓 No plans saved yet. Switch to /planning mode to create one.');
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      const statusEmoji: Record<string, string> = {
        saved: '💾', draft: '📝', executing: '🔄', complete: '✅', executed: '✅',
      };

      const list = plans.map((p: { plan_name: string; status: string }, i: number) =>
        `${i + 1}. ${p.plan_name} (${statusEmoji[p.status] || '📋'} ${p.status})`
      ).join('\n');

      await sendWhatsApp(senderPhone,
        `📓 YOUR PLANS\n\n${list}\n\nSay "execute [name]" to run any saved plan.`
      );

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });

  } catch (error) {
    console.error('execute-plan error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 200 });
  }
});
