import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { readFile, writeFile, createBranch, createPR } from './github.ts';

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
  const toAddr = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toAddr, From: twilioFrom, Body: body }).toString(),
  });
  console.log('Dev agent WhatsApp send:', res.status, await res.text());
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
      model: 'claude-3-haiku-20240307',
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

// ── CLAUDE CODE EXECUTION ─────────────────────────

interface FileEdit {
  file_path: string;
  action: 'replace' | 'prepend' | 'append' | 'create';
  search?: string;    // for replace only
  replace?: string;   // for replace only
  content?: string;   // for prepend/append/create
  description: string;
}

const getImplementationPlan = async (
  command: string,
  intent: string
): Promise<{
  title: string;
  summary: string;
  edits: FileEdit[];
}> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are CLARA Dev Agent for LifeLink Sync (React + TypeScript + Tailwind + Supabase).
Lee has confirmed this command: "${command}"
Interpreted intent: "${intent}"

Produce a JSON implementation plan. Keep edits minimal and targeted.

Edit actions available:
1. "replace" - find exact text and replace it. Use when: modifying existing content.
2. "prepend" - add content to top of file. Use when: adding headers, comments, imports.
3. "append" - add content to bottom of file. Use when: adding new functions, exports.
4. "create" - create a new file entirely. Use when: file doesn't exist yet.

Respond with JSON only:
{
  "title": "Short PR title (max 70 chars)",
  "summary": "1-3 sentence description of what changed and why",
  "edits": [
    {
      "file_path": "src/path/to/file.tsx",
      "action": "replace",
      "search": "exact string to find in the file",
      "replace": "replacement string",
      "description": "what this edit does"
    },
    {
      "file_path": "README.md",
      "action": "prepend",
      "content": "content to add at top of file",
      "description": "what this edit does"
    }
  ]
}

Rules:
- Use real file paths from the LifeLink Sync repo (src/, supabase/, public/)
- For "replace": search strings must be exact matches from current file content
- For "prepend"/"append": provide the content to add
- For "create": provide the full file content
- Keep edits small and focused — only change what the command asks for
- Never touch auth, payment, or emergency code unless explicitly asked
- Prefer editing existing files over creating new ones
- Maximum 5 edits per command`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('CLARA returned no valid plan');
  return JSON.parse(jsonMatch[0]);
};

const runClaudeCode = async (
  command: string,
  intent: string,
  logId: string,
  fromNumber: string
) => {
  // 1. Get implementation plan from CLARA
  const plan = await getImplementationPlan(command, intent);
  console.log('Plan:', plan.title, '—', plan.edits.length, 'edits');

  // 2. Create branch
  const timestamp = Date.now();
  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  const branchName = `agent/${timestamp}-${slug}`;

  await createBranch(branchName);
  console.log('Branch created:', branchName);

  // 3. Apply each file edit
  const filesRead: string[] = [];
  const filesChanged: string[] = [];
  const editSummaries: string[] = [];

  for (const edit of plan.edits) {
    try {
      let newContent: string;
      const action = edit.action || 'replace'; // backward compat

      if (action === 'create') {
        // Create new file — no read needed
        newContent = edit.content || '';
      } else {
        // Read current file for replace/prepend/append
        let currentContent: string;
        try {
          currentContent = await readFile(edit.file_path);
          filesRead.push(edit.file_path);
        } catch (readErr) {
          if (action === 'prepend' || action === 'append') {
            // File doesn't exist — treat as create
            currentContent = '';
          } else {
            throw readErr;
          }
        }

        if (action === 'replace') {
          if (!edit.search || !currentContent.includes(edit.search)) {
            console.warn(`Search string not found in ${edit.file_path}, skipping`);
            editSummaries.push(`⚠️ ${edit.file_path}: search string not found, skipped`);
            continue;
          }
          newContent = currentContent.replace(edit.search, edit.replace || '');
        } else if (action === 'prepend') {
          newContent = (edit.content || '') + '\n\n' + currentContent;
        } else if (action === 'append') {
          newContent = currentContent + '\n\n' + (edit.content || '');
        } else {
          console.warn(`Unknown action "${action}" for ${edit.file_path}, skipping`);
          editSummaries.push(`⚠️ ${edit.file_path}: unknown action "${action}"`);
          continue;
        }
      }

      // Write file
      await writeFile(
        edit.file_path,
        newContent,
        branchName,
        `${edit.description}\n\nCo-Authored-By: CLARA Dev Agent <clara@lifelink-sync.com>`
      );

      filesChanged.push(edit.file_path);
      editSummaries.push(`✅ ${edit.file_path}: ${edit.description}`);
      console.log('Edit applied:', edit.file_path, `(${action})`);
    } catch (editError) {
      const msg = (editError as Error).message;
      console.error(`Edit failed for ${edit.file_path}:`, msg);
      editSummaries.push(`❌ ${edit.file_path}: ${msg.slice(0, 100)}`);
    }
  }

  // 4. Create PR (only if we changed at least one file)
  if (filesChanged.length === 0) {
    await supabase.from('dev_agent_log')
      .update({
        status: 'failed',
        error_message: 'No edits could be applied — search strings did not match current file content',
        branch_name: branchName,
        files_read: filesRead,
      })
      .eq('id', logId);

    await sendWhatsApp(fromNumber,
      `⚠️ No edits applied — the search strings didn't match current files. The plan was:\n${editSummaries.join('\n')}`
    );
    return;
  }

  const prBody = `## Summary\n${plan.summary}\n\n## Changes\n${editSummaries.join('\n')}\n\n## Command\n> ${command}\n\n🤖 Generated by CLARA Dev Agent`;

  const pr = await createPR(branchName, plan.title, prBody);
  console.log('PR created:', pr.url);

  // 5. Update log
  await supabase.from('dev_agent_log')
    .update({
      status: 'completed',
      branch_name: branchName,
      pr_number: pr.number,
      pr_url: pr.url,
      files_read: filesRead,
      files_changed: filesChanged,
      diff_summary: editSummaries.join('\n'),
    })
    .eq('id', logId);

  // 6. Notify Lee
  const fileList = filesChanged.join(', ');
  await sendWhatsApp(fromNumber,
    `✅ Done — PR #${pr.number}: ${plan.title}\nFiles: ${fileList}\n${pr.url}\nLive ~2 mins after merge.`
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse Twilio webhook (URL-encoded body)
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    const fromNumber = params.get('From') ?? '';
    const messageBody = (params.get('Body') ?? '').trim();

    console.log('Dev agent received:', { fromNumber, bodyLength: messageBody.length });

    // ── HARD AUTH CHECK ──────────────────────────────
    const normalizedFrom = fromNumber.replace('whatsapp:', '').replace('+', '');
    const normalizedAdmin = adminNumber.replace('whatsapp:', '').replace('+', '');

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

        // Execute the command via GitHub App
        try {
          await runClaudeCode(
            pendingSession.command_text,
            pendingSession.clara_intent,
            pendingSession.log_id,
            fromNumber
          );
        } catch (execError) {
          const errMsg = (execError as Error).message;
          console.error('Execution error:', errMsg);

          await supabase.from('dev_agent_log')
            .update({ status: 'failed', error_message: errMsg })
            .eq('id', pendingSession.log_id);

          const isGitHubMissing = errMsg.includes('GITHUB_APP_ID') ||
            errMsg.includes('token exchange') ||
            errMsg.includes('GitHub');

          await sendWhatsApp(fromNumber,
            isGitHubMissing
              ? "⚠️ GitHub App not configured yet. Add GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_INSTALLATION_ID secrets to Supabase to enable code execution."
              : `❌ Execution failed: ${errMsg.slice(0, 200)}`
          );
        }

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
